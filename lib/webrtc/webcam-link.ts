'use client';

/**
 * Link webcam telefono↔PC su WebRTC nativo (RTCPeerConnection), ottimizzato
 * per la latenza minima:
 *  - connessione P2P diretta (host/srflx); TURN solo come relay di fallback;
 *  - trickle ICE per un setup rapido;
 *  - jitter buffer ridotto sul ricevitore (PC);
 *  - encoder del telefono in 'maintain-framerate' + codec con HW preferiti.
 *
 * Ruoli: il PC è il RICEVITORE (host, crea l'offer e mostra il QR), il telefono
 * è il MITTENTE (guest, apre la fotocamera e risponde).
 *
 * Negoziazione: il PC crea un'offer recvonly; il telefono NON deve creare
 * transceiver prima dell'offer (altrimenti l'm-line non si allinea e ICE può
 * risultare "connected" senza video — v. discuss-webrtc addTransceiver vs addTrack).
 */

import { getIceServers } from './ice-config';
import { SignalingChannel, type SignalMessage } from './signaling';

export type LinkState = 'idle' | 'connecting' | 'waiting' | 'connected' | 'failed' | 'closed';

const MAX_VIDEO_BITRATE = 2_500_000;
const TARGET_FPS = 30;
/** Timeout setup ICE/signaling. */
const CONNECT_TIMEOUT_MS = 30_000;
/** Dopo ICE connected, quanto attendere il primo frame prima di fallire. */
const STREAM_TIMEOUT_MS = 15_000;

function newPc(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: getIceServers(), bundlePolicy: 'max-bundle' });
}

function mapState(pc: RTCPeerConnection, cb?: (s: LinkState) => void): void {
  const st = pc.connectionState;
  if (st === 'connected') cb?.('connected');
  else if (st === 'failed') cb?.('failed');
  else if (st === 'disconnected' || st === 'closed') cb?.('closed');
}

function logNegotiationError(
  sessionId: string,
  side: 'host' | 'guest',
  kind: string,
  err: unknown,
  pc: RTCPeerConnection,
): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[webcam-link:${side}] ${kind} fallito`, {
      sessionId,
      signalingState: pc.signalingState,
      connectionState: pc.connectionState,
      err,
    });
  }
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

/** Mette H.264/VP8 (encoder hardware diffusi sui telefoni) davanti agli altri. */
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

async function reportRtt(pc: RTCPeerConnection, cb: (ms: number) => void): Promise<void> {
  try {
    const stats = await pc.getStats();
    stats.forEach((r) => {
      const pair = r as RTCIceCandidatePairStats & { nominated?: boolean };
      if (pair.type === 'candidate-pair' && pair.nominated && pair.currentRoundTripTime != null) {
        cb(Math.round(pair.currentRoundTripTime * 1000));
      }
    });
  } catch {
    /* getStats può fallire durante la chiusura */
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

/** Track da ontrack (streams[] può essere vuoto). */
function streamFromTrackEvent(
  e: RTCTrackEvent,
  inbound: MediaStream | null,
): MediaStream | null {
  if (e.streams[0]) return e.streams[0];
  if (!e.track || e.track.kind !== 'video') return null;
  return mergeTrackIntoStream(e.track, inbound);
}

/** Fallback: track già sui receiver ma ontrack non arrivato. */
function harvestVideoStream(
  pc: RTCPeerConnection,
  inbound: MediaStream | null,
): MediaStream | null {
  let out = inbound;
  for (const receiver of pc.getReceivers()) {
    const track = receiver.track;
    if (track?.kind === 'video' && track.readyState !== 'ended') {
      applyLowLatencyReceiverHints(receiver);
      out = mergeTrackIntoStream(track, out);
    }
  }
  return out;
}

export interface LinkHandlers {
  onState?: (s: LinkState) => void;
  onError?: (message: string) => void;
}

export interface ReceiverHandlers extends LinkHandlers {
  onStream?: (s: MediaStream) => void;
  onRtt?: (ms: number) => void;
}

export interface LinkController {
  start: () => void;
  stop: () => void;
  pc: RTCPeerConnection;
}

/** PC: riceve il flusso del telefono e lo espone come "webcam". */
export function createWebcamReceiver(sessionId: string, h: ReceiverHandlers): LinkController {
  const pc = newPc();
  const pending: RTCIceCandidateInit[] = [];
  let remoteSet = false;
  let inboundStream: MediaStream | null = null;
  let streamDelivered = false;
  let statsTimer: ReturnType<typeof setInterval> | null = null;
  let connectWatchdog: ReturnType<typeof setTimeout> | null = null;
  let streamWatchdog: ReturnType<typeof setTimeout> | null = null;

  const fail = (message: string) => {
    h.onError?.(message);
    h.onState?.('failed');
  };

  const clearConnectWatchdog = () => {
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

  const deliverStream = (stream: MediaStream | null) => {
    if (!stream || streamDelivered) return;
    inboundStream = stream;
    streamDelivered = true;
    clearStreamWatchdog();
    h.onStream?.(stream);
  };

  const tryDeliverInbound = () => {
    deliverStream(harvestVideoStream(pc, inboundStream));
  };

  const armStreamWatchdog = () => {
    clearStreamWatchdog();
    streamWatchdog = setTimeout(() => {
      if (streamDelivered) return;
      fail(
        'Connessione aperta ma il video non arriva. Verifica la rete e riprova tra poco.',
      );
    }, STREAM_TIMEOUT_MS);
  };

  pc.addTransceiver('video', { direction: 'recvonly' });

  pc.ontrack = (e) => {
    if (e.receiver) applyLowLatencyReceiverHints(e.receiver);
    const stream = streamFromTrackEvent(e, inboundStream);
    if (stream) deliverStream(stream);
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) void sig.send('candidate', e.candidate.toJSON());
  };

  pc.onconnectionstatechange = () => {
    const st = pc.connectionState;
    if (st === 'connected') {
      clearConnectWatchdog();
      h.onState?.('connected');
      tryDeliverInbound();
      if (!streamDelivered) armStreamWatchdog();
    } else if (st === 'failed') {
      clearConnectWatchdog();
      clearStreamWatchdog();
      h.onState?.('failed');
    } else if (st === 'closed') {
      clearConnectWatchdog();
      clearStreamWatchdog();
      h.onState?.('closed');
    }
  };

  const sig = new SignalingChannel(sessionId, 'host', async (m: SignalMessage) => {
    if (m.kind === 'answer') {
      if (pc.signalingState !== 'have-local-offer') return;
      try {
        await pc.setRemoteDescription(m.data as RTCSessionDescriptionInit);
      } catch (err) {
        logNegotiationError(sessionId, 'host', 'answer', err, pc);
        fail('Impossibile applicare la risposta del telefono.');
        return;
      }
      remoteSet = true;
      for (const c of pending.splice(0)) {
        try {
          await pc.addIceCandidate(c);
        } catch (err) {
          logNegotiationError(sessionId, 'host', 'candidate', err, pc);
        }
      }
      tryDeliverInbound();
    } else if (m.kind === 'candidate') {
      const c = m.data as RTCIceCandidateInit;
      if (remoteSet) {
        try {
          await pc.addIceCandidate(c);
        } catch (err) {
          logNegotiationError(sessionId, 'host', 'candidate', err, pc);
        }
      } else {
        pending.push(c);
      }
    }
  });

  async function start(): Promise<void> {
    h.onState?.('connecting');
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sig.send('offer', offer);
    } catch (err) {
      logNegotiationError(sessionId, 'host', 'offer', err, pc);
      fail('Impossibile avviare la connessione webcam.');
      return;
    }
    sig.start();
    h.onState?.('waiting');
    if (h.onRtt) statsTimer = setInterval(() => void reportRtt(pc, h.onRtt!), 2000);
    clearConnectWatchdog();
    connectWatchdog = setTimeout(() => {
      if (pc.connectionState !== 'connected') h.onState?.('failed');
    }, CONNECT_TIMEOUT_MS);
  }

  function stop(): void {
    clearConnectWatchdog();
    clearStreamWatchdog();
    if (statsTimer) clearInterval(statsTimer);
    void sig.send('bye', null);
    sig.stop();
    pc.getReceivers().forEach((r) => r.track?.stop());
    inboundStream = null;
    streamDelivered = false;
    try {
      pc.close();
    } catch {
      /* già chiusa */
    }
    h.onState?.('closed');
  }

  return { start: () => void start(), stop, pc };
}

export interface SenderHandlers extends LinkHandlers {}

/** Telefono: cattura la fotocamera (stream passato) e la invia al PC. */
export function createWebcamSender(
  sessionId: string,
  stream: MediaStream,
  h: SenderHandlers,
): LinkController {
  const pc = newPc();
  const pending: RTCIceCandidateInit[] = [];
  let remoteSet = false;
  let answered = false;

  const videoTrack = stream.getVideoTracks()[0] ?? null;
  if (videoTrack) videoTrack.contentHint = 'motion';

  const fail = (message: string) => {
    h.onError?.(message);
    h.onState?.('failed');
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) void sig.send('candidate', e.candidate.toJSON());
  };
  pc.onconnectionstatechange = () => mapState(pc, h.onState);

  async function tuneSenders(): Promise<void> {
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

  const sig = new SignalingChannel(sessionId, 'guest', async (m: SignalMessage) => {
    if (m.kind === 'offer') {
      if (answered || pc.signalingState !== 'stable') return;
      try {
        await pc.setRemoteDescription(m.data as RTCSessionDescriptionInit);
        remoteSet = true;
        for (const c of pending.splice(0)) {
          try {
            await pc.addIceCandidate(c);
          } catch (err) {
            logNegotiationError(sessionId, 'guest', 'candidate', err, pc);
          }
        }
        // Allinea il track all'm-line recvonly dell'offer (non addTransceiver prima dell'offer).
        if (videoTrack) {
          pc.addTrack(videoTrack, stream);
        } else {
          fail('Nessuna traccia video dalla fotocamera.');
          return;
        }
        preferLowLatencyCodecs(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await tuneSenders();
        answered = true;
        await sig.send('answer', answer);
      } catch (err) {
        logNegotiationError(sessionId, 'guest', 'offer', err, pc);
        fail('Impossibile rispondere all’offerta del PC.');
      }
    } else if (m.kind === 'candidate') {
      const c = m.data as RTCIceCandidateInit;
      if (remoteSet) {
        try {
          await pc.addIceCandidate(c);
        } catch (err) {
          logNegotiationError(sessionId, 'guest', 'candidate', err, pc);
        }
      } else {
        pending.push(c);
      }
    } else if (m.kind === 'bye') {
      stop();
    }
  });

  function start(): void {
    h.onState?.('connecting');
    sig.start();
  }

  function stop(): void {
    void sig.send('bye', null);
    sig.stop();
    try {
      pc.close();
    } catch {
      /* già chiusa */
    }
    h.onState?.('closed');
  }

  return { start, stop, pc };
}
