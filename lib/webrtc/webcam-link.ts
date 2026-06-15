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

function newPc(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: getIceServers(), bundlePolicy: 'max-bundle' });
}

function mapState(pc: RTCPeerConnection, cb?: (s: LinkState) => void): void {
  const st = pc.connectionState;
  if (st === 'connected') cb?.('connected');
  else if (st === 'failed') cb?.('failed');
  else if (st === 'disconnected' || st === 'closed') cb?.('closed');
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

export interface ReceiverHandlers {
  onStream?: (s: MediaStream) => void;
  onState?: (s: LinkState) => void;
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
  let statsTimer: ReturnType<typeof setInterval> | null = null;

  pc.addTransceiver('video', { direction: 'recvonly' });

  pc.ontrack = (e) => {
    const stream = e.streams[0];
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
    if (stream) h.onStream?.(stream);
  };
  pc.onicecandidate = (e) => {
    if (e.candidate) void sig.send('candidate', e.candidate.toJSON());
  };
  pc.onconnectionstatechange = () => mapState(pc, h.onState);

  const sig = new SignalingChannel(sessionId, 'host', async (m: SignalMessage) => {
    if (m.kind === 'answer') {
      if (pc.signalingState !== 'have-local-offer') return; // answer duplicata/fuori stato
      try {
        await pc.setRemoteDescription(m.data as RTCSessionDescriptionInit);
      } catch {
        return;
      }
      remoteSet = true;
      for (const c of pending.splice(0)) {
        try {
          await pc.addIceCandidate(c);
        } catch {
          /* candidato obsoleto */
        }
      }
    } else if (m.kind === 'candidate') {
      const c = m.data as RTCIceCandidateInit;
      if (remoteSet) {
        try {
          await pc.addIceCandidate(c);
        } catch {
          /* ignora */
        }
      } else {
        pending.push(c);
      }
    }
  });

  async function start(): Promise<void> {
    h.onState?.('connecting');
    preferLowLatencyCodecs(pc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sig.send('offer', offer);
    sig.start();
    h.onState?.('waiting');
    if (h.onRtt) statsTimer = setInterval(() => void reportRtt(pc, h.onRtt!), 2000);
  }

  function stop(): void {
    if (statsTimer) clearInterval(statsTimer);
    void sig.send('bye', null);
    sig.stop();
    pc.getReceivers().forEach((r) => r.track?.stop());
    try {
      pc.close();
    } catch {
      /* già chiusa */
    }
    h.onState?.('closed');
  }

  return { start: () => void start(), stop, pc };
}

export interface SenderHandlers {
  onState?: (s: LinkState) => void;
}

/** Telefono: cattura la fotocamera (stream passato) e la invia al PC. */
export function createWebcamSender(
  sessionId: string,
  stream: MediaStream,
  h: SenderHandlers,
): LinkController {
  const pc = newPc();
  const pending: RTCIceCandidateInit[] = [];
  let remoteSet = false;

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
          } catch {
            /* candidato obsoleto */
          }
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await tuneSenders();
        await sig.send('answer', answer);
      } catch {
        /* offer fuori sequenza: ignora */
      }
    } else if (m.kind === 'candidate') {
      const c = m.data as RTCIceCandidateInit;
      if (remoteSet) {
        try {
          await pc.addIceCandidate(c);
        } catch {
          /* ignora */
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
