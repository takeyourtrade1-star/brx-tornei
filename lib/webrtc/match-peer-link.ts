'use client';

import { matchSignalingBase } from './ice-config';
import { SignalingChannel, type SignalMessage } from './signaling';
import {
  applyLowLatencyReceiverHints,
  collectConnectionQuality,
  detectTransport,
  harvestRemoteStream,
  newPeerConnection,
  parseEnvelope,
  preferLowLatencyCodecs,
  streamFromTrackEvent,
  tuneSenders,
} from './match-peer-media';
import type {
  PeerLinkController,
  PeerLinkHandlers,
  PeerRole,
  PeerTransport,
} from './match-peer-types';
import { createPeerWatchdogs } from './peer-watchdogs';
export type { PeerLinkState, PeerRole, PeerTransport } from './match-peer-types';
const CONNECT_TIMEOUT_MS = 30_000;
const STREAM_TIMEOUT_MS = 15_000;
const HEARTBEAT_INTERVAL_MS = 3_000;
const HEARTBEAT_TIMEOUT_MS = 10_000;
const QUALITY_SAMPLE_INTERVAL_MS = 10_000;

export function peerTransportIsConnected(
  connectionState: RTCPeerConnectionState,
  iceState: RTCIceConnectionState,
): boolean {
  return (
    connectionState === 'connected' &&
    (iceState === 'connected' || iceState === 'completed')
  );
}

export function peerTransportIsLost(
  connectionState: RTCPeerConnectionState,
  iceState: RTCIceConnectionState,
): boolean {
  return (
    connectionState === 'disconnected' ||
    connectionState === 'failed' ||
    iceState === 'disconnected' ||
    iceState === 'failed'
  );
}
export function createMatchPeerLink(
  sessionId: string,
  role: PeerRole,
  localStream: MediaStream,
  allowDirect: boolean,
  handlers: PeerLinkHandlers,
): PeerLinkController {
  let pc: RTCPeerConnection | null = null;
  let sig: SignalingChannel | null = null;
  let pending: { attemptId: string; candidate: RTCIceCandidateInit }[] = [];
  let remoteSet = false;
  let activeAttemptId = role === 'host' ? crypto.randomUUID() : null;
  let stopped = false;
  const watchdogs = createPeerWatchdogs<'connect' | 'stream' | 'disconnect' | 'media'>();
  let inboundStream: MediaStream | null = null;
  let remoteDelivered = false;
  let heartbeatChannel: RTCDataChannel | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let lastHeartbeatAt = 0;
  let peerLossReported = false;
  let qualityTimer: ReturnType<typeof setInterval> | null = null;
  let currentTransport: PeerTransport = 'unknown';
  const isCurrent = (connection: RTCPeerConnection | null): connection is RTCPeerConnection => !stopped && connection !== null && pc === connection;
  const fail = (message: string) => {
    if (stopped) return;
    handlers.onError?.(message);
    handlers.onState?.('failed');
  };
  const markPeerLost = () => {
    if (stopped) return;
    const firstLossSignal = !peerLossReported;
    sig?.setConnected(false);
    handlers.onState?.('reconnecting');
    if (firstLossSignal) {
      handlers.onPeerLost?.();
      watchdogs.arm('disconnect', () => {
        if (peerLossReported && !stopped) {
          fail('Connessione video interrotta. Nuovo tentativo in corso\u2026');
        }
      }, 8_000);
    }
    peerLossReported = true;
  };
  const markPeerAlive = () => {
    if (stopped) return;
    const recovered = peerLossReported;
    peerLossReported = false;
    watchdogs.clear('disconnect');
    watchdogs.clear('media');
    handlers.onState?.('connected');
    if (recovered) handlers.onPeerAlive?.();
    sig?.setConnected(true);
  };
  const sampleQuality = (connection: RTCPeerConnection) => {
    void collectConnectionQuality(connection, currentTransport).then((quality) => {
      if (isCurrent(connection)) handlers.onQuality?.(quality);
    });
  };
  const startQualitySampling = (connection: RTCPeerConnection) => {
    if (qualityTimer) return;
    sampleQuality(connection);
    qualityTimer = setInterval(() => sampleQuality(connection), QUALITY_SAMPLE_INTERVAL_MS);
  };
  const stopQualitySampling = () => {
    if (qualityTimer) clearInterval(qualityTimer);
    qualityTimer = null;
  };
  const stopHeartbeat = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    const channel = heartbeatChannel;
    heartbeatChannel = null;
    try {
      channel?.close();
    } catch {}
  };
  const attachHeartbeat = (channel: RTCDataChannel) => {
    stopHeartbeat();
    heartbeatChannel = channel;
    const sendPulse = () => {
      if (stopped || channel.readyState !== 'open') return;
      if (lastHeartbeatAt > 0 && Date.now() - lastHeartbeatAt > HEARTBEAT_TIMEOUT_MS) {
        markPeerLost();
      }
      try {
        channel.send('p');
      } catch {
        markPeerLost();
      }
    };
    channel.onopen = () => {
      if (heartbeatChannel !== channel || stopped) return;
      lastHeartbeatAt = Date.now();
      sendPulse();
      heartbeatTimer = setInterval(sendPulse, HEARTBEAT_INTERVAL_MS);
    };
    channel.onmessage = () => {
      if (heartbeatChannel !== channel || stopped) return;
      lastHeartbeatAt = Date.now();
      if (peerLossReported && pc?.connectionState === 'connected') markPeerAlive();
    };
    channel.onclose = () => {
      if (heartbeatChannel === channel) markPeerLost();
    };
    channel.onerror = () => {
      if (heartbeatChannel === channel) markPeerLost();
    };
  };
  const sendSignal = (kind: SignalMessage['kind'], payload: unknown) => {
    if (stopped || !sig || !activeAttemptId) return Promise.resolve();
    return sig.send(kind, { attemptId: activeAttemptId, payload });
  };
  const deliverRemote = (stream: MediaStream | null) => {
    if (!stream || remoteDelivered) return;
    inboundStream = stream;
    if (stream.getVideoTracks().length === 0) return;
    remoteDelivered = true;
    watchdogs.clear('stream');
    handlers.onRemoteStream?.(stream);
  };
  const tryDeliverInbound = () => {
    if (!pc) return;
    deliverRemote(harvestRemoteStream(pc, inboundStream));
  };
  const armStreamWatchdog = () => {
    watchdogs.arm('stream', () => {
      if (remoteDelivered) return;
      fail(
        'Connessione aperta ma il video non arriva. Verifica la rete e riprova tra poco.',
      );
    }, STREAM_TIMEOUT_MS);
  };
  async function setup(): Promise<void> {
    const nextPeer = await newPeerConnection(sessionId, allowDirect);
    if (stopped) {
      nextPeer.close();
      return;
    }
    pc = nextPeer;
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) {
      fail('Webcam non disponibile');
      return;
    }
    videoTrack.contentHint = 'motion';
    pc.addTrack(videoTrack, localStream);
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      pc.addTrack(audioTrack, localStream);
    } else if (role === 'host') {
      pc.addTransceiver('audio', { direction: 'recvonly' });
    }
    preferLowLatencyCodecs(pc);
    nextPeer.ontrack = (e) => {
      if (!isCurrent(nextPeer)) return;
      if (e.receiver) applyLowLatencyReceiverHints(e.receiver);
      const stream = streamFromTrackEvent(e, inboundStream);
      if (stream) deliverRemote(stream);
      e.track.onmute = () => {
        watchdogs.arm('media', () => {
          if (isCurrent(nextPeer) && e.track.muted) markPeerLost();
        }, 5_000);
      };
      e.track.onunmute = () => {
        watchdogs.clear('media');
        if (isCurrent(nextPeer) && nextPeer.connectionState === 'connected') {
          markPeerAlive();
        }
      };
      e.track.onended = () => {
        if (isCurrent(nextPeer)) markPeerLost();
      };
    };
    nextPeer.onicecandidate = (e) => {
      if (isCurrent(nextPeer) && e.candidate) {
        void sendSignal('candidate', e.candidate.toJSON()).catch(() => {});
      }
    };
    const handleConnectionState = () => {
      if (!isCurrent(nextPeer)) return;
      const connected = peerTransportIsConnected(
        nextPeer.connectionState,
        nextPeer.iceConnectionState,
      );
      if (connected) {
        watchdogs.clear('connect');
        markPeerAlive();
        void detectTransport(nextPeer).then((transport) => {
          if (isCurrent(nextPeer)) {
            currentTransport = transport;
            handlers.onTransport?.(transport);
            sampleQuality(nextPeer);
          }
        });
        startQualitySampling(nextPeer);
        tryDeliverInbound();
        if (!remoteDelivered) armStreamWatchdog();
      } else if (
        peerTransportIsLost(nextPeer.connectionState, nextPeer.iceConnectionState) &&
        nextPeer.connectionState !== 'failed' &&
        nextPeer.iceConnectionState !== 'failed'
      ) {
        markPeerLost();
        watchdogs.arm('disconnect', () => {
          if (
            isCurrent(nextPeer) &&
            (nextPeer.connectionState === 'disconnected' ||
              nextPeer.iceConnectionState === 'disconnected')
          ) {
            fail('Connessione video interrotta. Nuovo tentativo in corso\u2026');
          }
        }, 8_000);
      } else if (
        nextPeer.connectionState === 'failed' ||
        nextPeer.iceConnectionState === 'failed'
      ) {
        watchdogs.clearAll();
        markPeerLost();
        fail('La connessione video non risponde. Nuovo tentativo in corso\u2026');
      } else if (nextPeer.connectionState === 'closed') {
        watchdogs.clearAll();
        handlers.onState?.('closed');
      }
    };
    nextPeer.onconnectionstatechange = handleConnectionState;
    nextPeer.oniceconnectionstatechange = handleConnectionState;
    nextPeer.ondatachannel = (event) => {
      if (event.channel.label === 'brx-presence' && isCurrent(nextPeer)) {
        attachHeartbeat(event.channel);
      }
    };
    if (role === 'host') {
      attachHeartbeat(
        nextPeer.createDataChannel('brx-presence', {
          ordered: false,
          maxRetransmits: 0,
        }),
      );
    }
    const basePath = matchSignalingBase(sessionId);
    sig = new SignalingChannel(sessionId, role, async (m: SignalMessage) => {
      const connection = pc;
      if (!isCurrent(connection)) return;
      const envelope = parseEnvelope(m.data);
      if (!envelope) return;

      if (role === 'host' && m.kind === 'answer') {
        if (envelope.attemptId !== activeAttemptId) return;
        if (connection.signalingState !== 'have-local-offer') return;
        try {
          await connection.setRemoteDescription(envelope.payload as RTCSessionDescriptionInit);
          if (!isCurrent(connection)) return;
          remoteSet = true;
          const candidates = pending.filter((item) => item.attemptId === activeAttemptId);
          pending = [];
          for (const item of candidates) {
            await connection.addIceCandidate(item.candidate);
            if (!isCurrent(connection)) return;
          }
          await tuneSenders(connection);
          if (!isCurrent(connection)) return;
          tryDeliverInbound();
        } catch {
          fail('Impossibile applicare la risposta dell’avversario.');
        }
      } else if (role === 'guest' && m.kind === 'offer') {
        if (connection.signalingState !== 'stable') return;
        try {
          activeAttemptId = envelope.attemptId;
          remoteSet = false;
          await connection.setRemoteDescription(envelope.payload as RTCSessionDescriptionInit);
          if (!isCurrent(connection)) return;
          remoteSet = true;
          const candidates = pending.filter((item) => item.attemptId === activeAttemptId);
          pending = pending.filter((item) => item.attemptId !== activeAttemptId);
          for (const item of candidates) {
            await connection.addIceCandidate(item.candidate);
            if (!isCurrent(connection)) return;
          }
          const answer = await connection.createAnswer();
          if (!isCurrent(connection)) return;
          await connection.setLocalDescription(answer);
          if (!isCurrent(connection)) return;
          preferLowLatencyCodecs(connection);
          await tuneSenders(connection);
          if (!isCurrent(connection)) return;
          await sendSignal('answer', answer);
        } catch {
          fail('Impossibile rispondere all’offerta dell’avversario.');
        }
      } else if (m.kind === 'candidate') {
        const candidate = envelope.payload as RTCIceCandidateInit;
        if (remoteSet && envelope.attemptId === activeAttemptId) {
          try {
            await connection.addIceCandidate(candidate);
          } catch {}
        } else {
          pending.push({ attemptId: envelope.attemptId, candidate });
        }
      } else if (m.kind === 'bye') {
        if (envelope.attemptId === activeAttemptId) {
          handlers.onPeerLeft?.();
          shutdown('peer-left');
        }
      } else if (m.kind === 'offline') {
        markPeerLost();
      }
    }, basePath, () => {
      if (stopped) return;
      handlers.onSessionEnded?.();
      shutdown('session-ended');
    });
    sig.start();
    handlers.onState?.(role === 'host' ? 'waiting' : 'connecting');

    if (role === 'host') {
      try {
        const offer = await nextPeer.createOffer();
        if (!isCurrent(nextPeer)) return;
        await nextPeer.setLocalDescription(offer);
        if (!isCurrent(nextPeer)) return;
        await sendSignal('offer', offer);
      } catch {
        fail('Impossibile avviare la connessione video.');
        return;
      }
    }
    watchdogs.arm('connect', () => {
      if (pc?.connectionState !== 'connected') {
        fail('Tempo di connessione scaduto. Nuovo tentativo in corso\u2026');
      }
    }, CONNECT_TIMEOUT_MS);
  }
  function start(): void {
    stopped = false;
    handlers.onState?.('connecting');
    void setup().catch(() => fail('Impossibile avviare la connessione video.'));
  }
  function shutdown(finalState: 'closed' | 'peer-left' | 'session-ended'): void {
    stopped = true;
    watchdogs.clearAll();
    stopHeartbeat();
    stopQualitySampling();
    sig?.stop();
    try {
      pc?.close();
    } catch {}
    pc = null;
    sig = null;
    inboundStream = null;
    remoteDelivered = false;
    handlers.onTransport?.('unknown');
    currentTransport = 'unknown';
    handlers.onState?.(finalState);
  }
  function stop(): void {
    shutdown('closed');
  }
  async function notifyLeave(): Promise<void> {
    await sendSignal('bye', { reason: 'voluntary' });
  }
  async function notifyOffline(): Promise<void> {
    await sendSignal('offline', { reason: 'page-hidden' });
  }
  return { start, stop, notifyLeave, notifyOffline };
}
