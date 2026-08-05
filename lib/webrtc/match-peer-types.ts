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
  onPeerLeft?: () => void;
  /** Il backend ha chiuso la sessione (match finito): non un bye dell'avversario. */
  onSessionEnded?: () => void;
  /** Il peer connection locale ha perso l'avversario (ICE disconnected/failed):
   * avvia il countdown di abbandono lato backend (90s). */
  onPeerLost?: () => void;
  /** Il peer connection locale ha ristabilito il link (ICE connected):
   * azzera il countdown di abbandono lato backend. */
  onPeerAlive?: () => void;
}

export interface PeerLinkController {
  start: () => void;
  stop: () => void;
  notifyLeave: () => Promise<void>;
}

export interface SignalEnvelope {
  attemptId: string;
  payload: unknown;
}
