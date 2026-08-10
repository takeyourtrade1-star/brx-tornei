import type { ConnectionQuality } from '@/types/tournament';

export type PeerLinkState =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'connected'
  | 'reconnecting'
  | 'failed'
  | 'peer-left'
  | 'session-ended'
  | 'closed';

export type PeerRole = 'host' | 'guest';
export type PeerTransport = 'direct' | 'relay' | 'unknown';

export interface PeerLinkHandlers {
  onState?: (state: PeerLinkState) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onError?: (message: string) => void;
  onTransport?: (transport: PeerTransport) => void;
  onQuality?: (quality: ConnectionQuality) => void;
  onPeerLeft?: () => void;
  /** Il backend ha chiuso la sessione (match finito): non un bye dell'avversario. */
  onSessionEnded?: () => void;
  /** Il peer connection locale ha perso il link (ICE disconnected/failed):
   * registra un segnale UX temporaneo, mai un risultato automatico. */
  onPeerLost?: () => void;
  /** Il peer connection locale ha ristabilito il link (ICE connected):
   * azzera il segnale UX temporaneo lato backend. */
  onPeerAlive?: () => void;
}

export interface PeerLinkController {
  start: () => void;
  stop: () => void;
  notifyLeave: () => Promise<void>;
  /** Best-effort lifecycle hint for tab/window close; never a forfeit. */
  notifyOffline: () => Promise<void>;
}

export interface SignalEnvelope {
  attemptId: string;
  payload: unknown;
}
