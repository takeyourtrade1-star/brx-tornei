'use client';

import { matchSignalingBase } from './ice-config';
import { SignalingChannel, type SignalMessage } from './signaling';
import {
  applyLowLatencyReceiverHints,
  detectTransport,
  harvestRemoteStream,
  newPeerConnection,
  parseEnvelope,
  preferLowLatencyCodecs,
  streamFromTrackEvent,
  tuneSenders,
} from './match-peer-media';
import type { PeerLinkController, PeerLinkHandlers, PeerRole } from './match-peer-types';
import { createPeerWatchdogs } from './peer-watchdogs';
export type { PeerLinkState, PeerRole, PeerTransport } from './match-peer-types';

const CONNECT_TIMEOUT_MS = 30_000;
const STREAM_TIMEOUT_MS = 15_000;

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
  const watchdogs = createPeerWatchdogs<'connect' | 'stream' | 'disconnect'>();
  let inboundStream: MediaStream | null = null;
  let remoteDelivered = false;

  const fail = (message: string) => {
    handlers.onError?.(message);
    handlers.onState?.('failed');
  };

  const sendSignal = (kind: SignalMessage['kind'], payload: unknown) => {
    if (!sig || !activeAttemptId) return Promise.resolve();
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
        'Connessione aperta ma il video non arriva. Prova la stessa rete Wi‑Fi o configura un server TURN.',
      );
    }, STREAM_TIMEOUT_MS);
  };

  async function setup(): Promise<void> {
    pc = await newPeerConnection(sessionId, allowDirect);
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

    pc.ontrack = (e) => {
      if (e.receiver) applyLowLatencyReceiverHints(e.receiver);
      const stream = streamFromTrackEvent(e, inboundStream);
      if (stream) deliverRemote(stream);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) void sendSignal('candidate', e.candidate.toJSON());
    };

    pc.onconnectionstatechange = () => {
      if (!pc) return;
      if (pc.connectionState === 'connected') {
        watchdogs.clear('connect');
        watchdogs.clear('disconnect');
        handlers.onState?.('connected');
        sig?.setConnected(true);
        void detectTransport(pc).then((transport) => handlers.onTransport?.(transport));
        tryDeliverInbound();
        if (!remoteDelivered) armStreamWatchdog();
      } else if (pc.connectionState === 'disconnected') {
        sig?.setConnected(false);
        handlers.onState?.('reconnecting');
        watchdogs.arm('disconnect', () => {
          if (pc?.connectionState === 'disconnected') {
            fail('Connessione video interrotta. Nuovo tentativo in corso\u2026');
          }
        }, 8_000);
      } else if (pc.connectionState === 'failed') {
        sig?.setConnected(false);
        watchdogs.clearAll();
        fail('La connessione video non risponde. Nuovo tentativo in corso\u2026');
      } else if (pc.connectionState === 'closed') {
        watchdogs.clearAll();
        handlers.onState?.('closed');
      }
    };

    const basePath = matchSignalingBase(sessionId);
    sig = new SignalingChannel(sessionId, role, async (m: SignalMessage) => {
      if (!pc) return;
      const envelope = parseEnvelope(m.data);
      if (!envelope) return;

      if (role === 'host' && m.kind === 'answer') {
        if (envelope.attemptId !== activeAttemptId) return;
        if (pc.signalingState !== 'have-local-offer') return;
        try {
          await pc.setRemoteDescription(envelope.payload as RTCSessionDescriptionInit);
          remoteSet = true;
          const candidates = pending.filter((item) => item.attemptId === activeAttemptId);
          pending = [];
          for (const item of candidates) await pc.addIceCandidate(item.candidate);
          await tuneSenders(pc);
          tryDeliverInbound();
        } catch {
          fail('Impossibile applicare la risposta dell’avversario.');
        }
      } else if (role === 'guest' && m.kind === 'offer') {
        if (pc.signalingState !== 'stable') return;
        try {
          activeAttemptId = envelope.attemptId;
          remoteSet = false;
          await pc.setRemoteDescription(envelope.payload as RTCSessionDescriptionInit);
          remoteSet = true;
          const candidates = pending.filter((item) => item.attemptId === activeAttemptId);
          pending = pending.filter((item) => item.attemptId !== activeAttemptId);
          for (const item of candidates) await pc.addIceCandidate(item.candidate);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          preferLowLatencyCodecs(pc);
          await tuneSenders(pc);
          await sendSignal('answer', answer);
        } catch {
          fail('Impossibile rispondere all’offerta dell’avversario.');
        }
      } else if (m.kind === 'candidate') {
        const candidate = envelope.payload as RTCIceCandidateInit;
        if (remoteSet && envelope.attemptId === activeAttemptId) {
          try {
            await pc.addIceCandidate(candidate);
          } catch {}
        } else {
          pending.push({ attemptId: envelope.attemptId, candidate });
        }
      } else if (m.kind === 'bye') {
        if (envelope.attemptId === activeAttemptId) {
          handlers.onPeerLeft?.();
          shutdown('peer-left');
        }
      }
    }, basePath);

    sig.start();
    handlers.onState?.(role === 'host' ? 'waiting' : 'connecting');

    if (role === 'host') {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal('offer', offer);
      } catch {
        fail('Impossibile avviare la connessione P2P.');
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
    handlers.onState?.('connecting');
    void setup();
  }

  function shutdown(finalState: 'closed' | 'peer-left'): void {
    watchdogs.clearAll();
    sig?.stop();
    try {
      pc?.close();
    } catch {}
    pc = null;
    sig = null;
    inboundStream = null;
    remoteDelivered = false;
    handlers.onTransport?.('unknown');
    handlers.onState?.(finalState);
  }

  function stop(): void {
    shutdown('closed');
  }

  async function notifyLeave(): Promise<void> {
    await sendSignal('bye', { reason: 'voluntary' });
  }

  return { start, stop, notifyLeave };
}
