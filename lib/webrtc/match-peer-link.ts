'use client';

/**
 * WebRTC P2P bidirezionale tra host e partecipante (volto PC).
 * Signaling relay via /api/tournaments/signaling/{sessionId}.
 */

import { fetchIceConfig, matchSignalingBase } from './ice-config';
import { SignalingChannel, type SignalMessage } from './signaling';

export type PeerLinkState =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'connected'
  | 'failed'
  | 'closed';

export type PeerRole = 'host' | 'guest';

const CONNECT_TIMEOUT_MS = 30_000;
const STREAM_TIMEOUT_MS = 15_000;
const MAX_VIDEO_BITRATE = 2_500_000;
const TARGET_FPS = 30;

export interface PeerLinkHandlers {
  onState?: (s: PeerLinkState) => void;
  onRemoteStream?: (s: MediaStream) => void;
  onError?: (message: string) => void;
}

export interface PeerLinkController {
  start: () => void;
  stop: () => void;
}

async function newPc(sessionId: string): Promise<RTCPeerConnection> {
  const { iceServers, forceRelay } = await fetchIceConfig(sessionId);
  // forceRelay: tutto il traffico passa dal TURN, gli IP dei peer restano
  // nascosti (torneo non "con un amico"). 'all' = P2P diretto consentito.
  return new RTCPeerConnection({
    iceServers,
    bundlePolicy: 'max-bundle',
    iceTransportPolicy: forceRelay ? 'relay' : 'all',
  });
}

function applyLowLatencyReceiverHints(receiver: RTCRtpReceiver): void {
  try {
    (receiver as unknown as { jitterBufferTarget?: number }).jitterBufferTarget = 0;
  } catch {
    /* non supportato */
  }
  try {
    (receiver as unknown as { playoutDelayHint?: number }).playoutDelayHint = 0;
  } catch {
    /* non supportato */
  }
}

function preferLowLatencyCodecs(pc: RTCPeerConnection): void {
  try {
    const caps = RTCRtpSender.getCapabilities?.('video');
    if (!caps) return;
    const order = ['video/H264', 'video/VP8', 'video/VP9', 'video/AV1'];
    const rank = (m: string) => (order.indexOf(m) === -1 ? 99 : order.indexOf(m));
    const sorted = [...caps.codecs].sort((a, b) => rank(a.mimeType) - rank(b.mimeType));
    for (const t of pc.getTransceivers()) {
      const kind = t.sender?.track?.kind ?? t.receiver?.track?.kind;
      if (kind === 'video') {
        try {
          t.setCodecPreferences?.(sorted);
        } catch {
          /* alcuni browser non lo supportano */
        }
      }
    }
  } catch {
    /* getCapabilities non disponibile */
  }
}

function mergeTrackIntoStream(
  track: MediaStreamTrack,
  inbound: MediaStream | null,
): MediaStream {
  const base = inbound ?? new MediaStream();
  if (!base.getTracks().some((t) => t.id === track.id)) {
    base.addTrack(track);
  }
  return base;
}

function streamFromTrackEvent(
  e: RTCTrackEvent,
  inbound: MediaStream | null,
): MediaStream | null {
  if (e.streams[0]) return e.streams[0];
  if (!e.track) return null;
  return mergeTrackIntoStream(e.track, inbound);
}

function harvestRemoteStream(
  pc: RTCPeerConnection,
  inbound: MediaStream | null,
): MediaStream | null {
  let out = inbound;
  for (const receiver of pc.getReceivers()) {
    const track = receiver.track;
    if (track && track.readyState !== 'ended') {
      if (track.kind === 'video') applyLowLatencyReceiverHints(receiver);
      out = mergeTrackIntoStream(track, out);
    }
  }
  return out && out.getTracks().length > 0 ? out : null;
}

async function tuneSenders(pc: RTCPeerConnection): Promise<void> {
  for (const sender of pc.getSenders()) {
    if (sender.track?.kind !== 'video') continue;
    const p = sender.getParameters();
    if (!p.encodings || p.encodings.length === 0) p.encodings = [{}];
    p.encodings[0].maxBitrate = MAX_VIDEO_BITRATE;
    p.encodings[0].maxFramerate = TARGET_FPS;
    (p as RTCRtpSendParameters & { degradationPreference?: string }).degradationPreference =
      'maintain-framerate';
    try {
      await sender.setParameters(p);
    } catch {
      /* alcuni parametri possono non essere applicabili */
    }
  }
}

export function createMatchPeerLink(
  sessionId: string,
  role: PeerRole,
  localStream: MediaStream,
  handlers: PeerLinkHandlers,
): PeerLinkController {
  let pc: RTCPeerConnection | null = null;
  let sig: SignalingChannel | null = null;
  let pending: RTCIceCandidateInit[] = [];
  let remoteSet = false;
  let connectWatchdog: ReturnType<typeof setTimeout> | null = null;
  let streamWatchdog: ReturnType<typeof setTimeout> | null = null;
  let inboundStream: MediaStream | null = null;
  let remoteDelivered = false;

  const fail = (message: string) => {
    handlers.onError?.(message);
    handlers.onState?.('failed');
  };

  const clearWatchdog = () => {
    if (connectWatchdog) {
      clearTimeout(connectWatchdog);
      connectWatchdog = null;
    }
  };

  const clearStreamWatchdog = () => {
    if (streamWatchdog) {
      clearTimeout(streamWatchdog);
      streamWatchdog = null;
    }
  };

  const deliverRemote = (stream: MediaStream | null) => {
    if (!stream || remoteDelivered) return;
    inboundStream = stream;
    // L'audio può arrivare prima: si consegna solo quando c'è anche il video.
    if (stream.getVideoTracks().length === 0) return;
    remoteDelivered = true;
    clearStreamWatchdog();
    handlers.onRemoteStream?.(stream);
  };

  const tryDeliverInbound = () => {
    if (!pc) return;
    deliverRemote(harvestRemoteStream(pc, inboundStream));
  };

  const armStreamWatchdog = () => {
    clearStreamWatchdog();
    streamWatchdog = setTimeout(() => {
      if (remoteDelivered) return;
      fail(
        'Connessione aperta ma il video non arriva. Prova la stessa rete Wi‑Fi o configura un server TURN.',
      );
    }, STREAM_TIMEOUT_MS);
  };

  async function setup(): Promise<void> {
    pc = await newPc(sessionId);
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
      // Senza mic locale l'host offre comunque l'm-line audio: l'answer del
      // guest non può aggiungerla, e il suo audio resterebbe non negoziato.
      pc.addTransceiver('audio', { direction: 'recvonly' });
    }
    preferLowLatencyCodecs(pc);

    pc.ontrack = (e) => {
      if (e.receiver) applyLowLatencyReceiverHints(e.receiver);
      const stream = streamFromTrackEvent(e, inboundStream);
      if (stream) deliverRemote(stream);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && sig) void sig.send('candidate', e.candidate.toJSON());
    };

    pc.onconnectionstatechange = () => {
      if (!pc) return;
      if (pc.connectionState === 'connected') {
        clearWatchdog();
        handlers.onState?.('connected');
        tryDeliverInbound();
        if (!remoteDelivered) armStreamWatchdog();
      } else if (pc.connectionState === 'failed') {
        clearWatchdog();
        clearStreamWatchdog();
        handlers.onState?.('failed');
      } else if (pc.connectionState === 'closed') {
        clearWatchdog();
        clearStreamWatchdog();
        handlers.onState?.('closed');
      }
    };

    const basePath = matchSignalingBase(sessionId);
    sig = new SignalingChannel(sessionId, role, async (m: SignalMessage) => {
      if (!pc) return;

      if (role === 'host' && m.kind === 'answer') {
        if (pc.signalingState !== 'have-local-offer') return;
        try {
          await pc.setRemoteDescription(m.data as RTCSessionDescriptionInit);
          remoteSet = true;
          for (const c of pending.splice(0)) await pc.addIceCandidate(c);
          await tuneSenders(pc);
          tryDeliverInbound();
        } catch {
          fail('Impossibile applicare la risposta dell’avversario.');
        }
      } else if (role === 'guest' && m.kind === 'offer') {
        if (pc.signalingState !== 'stable') return;
        try {
          await pc.setRemoteDescription(m.data as RTCSessionDescriptionInit);
          remoteSet = true;
          for (const c of pending.splice(0)) await pc.addIceCandidate(c);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          preferLowLatencyCodecs(pc);
          await tuneSenders(pc);
          await sig?.send('answer', answer);
        } catch {
          fail('Impossibile rispondere all’offerta dell’avversario.');
        }
      } else if (m.kind === 'candidate') {
        const c = m.data as RTCIceCandidateInit;
        if (remoteSet) {
          try {
            await pc.addIceCandidate(c);
          } catch {
            /* best effort */
          }
        } else {
          pending.push(c);
        }
      } else if (m.kind === 'bye') {
        stop();
      }
    }, basePath);

    sig.start();
    handlers.onState?.(role === 'host' ? 'waiting' : 'connecting');

    if (role === 'host') {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sig.send('offer', offer);
      } catch {
        fail('Impossibile avviare la connessione P2P.');
        return;
      }
    }

    connectWatchdog = setTimeout(() => {
      if (pc?.connectionState !== 'connected') handlers.onState?.('failed');
    }, CONNECT_TIMEOUT_MS);
  }

  function start(): void {
    handlers.onState?.('connecting');
    void setup();
  }

  function stop(): void {
    clearWatchdog();
    clearStreamWatchdog();
    void sig?.send('bye', null);
    sig?.stop();
    try {
      pc?.close();
    } catch {
      /* già chiusa */
    }
    pc = null;
    sig = null;
    inboundStream = null;
    remoteDelivered = false;
    handlers.onState?.('closed');
  }

  return { start, stop };
}
