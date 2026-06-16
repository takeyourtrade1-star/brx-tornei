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
 */

import { getIceServers } from './ice-config';
import { SignalingChannel, type SignalMessage } from './signaling';

export type LinkState = 'idle' | 'connecting' | 'waiting' | 'connected' | 'failed' | 'closed';

const MAX_VIDEO_BITRATE = 2_500_000; // ~2.5 Mbps: nitido a 720p senza gonfiare il buffer
const TARGET_FPS = 30;
/** Oltre questo tempo senza connessione, il setup è considerato fallito. */
const CONNECT_TIMEOUT_MS = 30_000;

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
          /* alcuni browser non lo supportano: si ignora */
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

/** Track senza MediaStream associato: costruisce o estende un flusso locale. */
function resolveInboundStream(
  e: RTCTrackEvent,
  inbound: MediaStream | null,
): MediaStream | null {
  if (e.streams[0]) return e.streams[0];
  if (!e.track) return null;
  const base = inbound ?? new MediaStream();
  if (!base.getTracks().some((t) => t.id === e.track.id)) {
    base.addTrack(e.track);
  }
  return base;
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
  let statsTimer: ReturnType<typeof setInterval> | null = null;
  let watchdog: ReturnType<typeof setTimeout> | null = null;

  const fail = (message: string) => {
    h.onError?.(message);
    h.onState?.('failed');
  };

  const clearWatchdog = () => {
    if (watchdog) {
      clearTimeout(watchdog);
      watchdog = null;
    }
  };

  pc.addTransceiver('video', { direction: 'recvonly' });

  pc.ontrack = (e) => {
    // Buffer di jitter al minimo: privilegia la latenza sulla fluidità assoluta.
    try {
      (e.receiver as unknown as { jitterBufferTarget?: number }).jitterBufferTarget = 0;
    } catch {
      /* non supportato */
    }
    try {
      (e.receiver as unknown as { playoutDelayHint?: number }).playoutDelayHint = 0;
    } catch {
      /* non supportato */
    }
    const stream = resolveInboundStream(e, inboundStream);
    if (stream) {
      inboundStream = stream;
      h.onStream?.(stream);
    }
  };
  pc.onicecandidate = (e) => {
    if (e.candidate) void sig.send('candidate', e.candidate.toJSON());
  };
  pc.onconnectionstatechange = () => {
    const st = pc.connectionState;
    if (st === 'connected') {
      clearWatchdog();
      h.onState?.('connected');
    } else if (st === 'failed') {
      clearWatchdog();
      h.onState?.('failed');
    } else if (st === 'closed') {
      clearWatchdog();
      h.onState?.('closed');
    }
    // 'disconnected' è spesso transitorio in fase di setup: non lo trattiamo
    // come fallimento, ci pensa il watchdog se non si riprende.
  };

  const sig = new SignalingChannel(sessionId, 'host', async (m: SignalMessage) => {
    if (m.kind === 'answer') {
      if (pc.signalingState !== 'have-local-offer') return; // answer duplicata/fuori stato
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
    preferLowLatencyCodecs(pc);
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
    // Se entro il timeout non si collega (telefono che non risponde, ICE che
    // non passa, signaling non condiviso tra istanze in prod...) lo segnaliamo
    // come fallimento invece di restare in caricamento all'infinito.
    clearWatchdog();
    watchdog = setTimeout(() => {
      if (pc.connectionState !== 'connected') h.onState?.('failed');
    }, CONNECT_TIMEOUT_MS);
  }

  function stop(): void {
    clearWatchdog();
    if (statsTimer) clearInterval(statsTimer);
    void sig.send('bye', null);
    sig.stop();
    pc.getReceivers().forEach((r) => r.track?.stop());
    inboundStream = null;
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

  const fail = (message: string) => {
    h.onError?.(message);
    h.onState?.('failed');
  };

  stream.getTracks().forEach((track) => {
    if (track.kind === 'video') track.contentHint = 'motion';
    pc.addTransceiver(track, { direction: 'sendonly', streams: [stream] });
  });

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
      if (pc.signalingState !== 'stable') return; // negoziazione già in corso
      preferLowLatencyCodecs(pc);
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
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await tuneSenders();
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
