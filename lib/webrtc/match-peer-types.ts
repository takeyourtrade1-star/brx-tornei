export type PeerLinkState =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'connected'
  | 'reconnecting'
  | 'failed'
  | 'peer-left'
  | 'closed';

export type PeerRole = 'host' | 'guest';
export type PeerTransport = 'direct' | 'relay' | 'unknown';

export interface PeerLinkHandlers {
  onState?: (state: PeerLinkState) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onError?: (message: string) => void;
  onTransport?: (transport: PeerTransport) => void;
  onPeerLeft?: () => void;
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
