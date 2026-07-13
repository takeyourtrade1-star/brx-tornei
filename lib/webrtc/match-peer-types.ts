export type PeerLinkState =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'connected'
  | 'failed'
  | 'closed';

export type PeerRole = 'host' | 'guest';
export type PeerTransport = 'direct' | 'relay' | 'unknown';

export interface PeerLinkHandlers {
  onState?: (state: PeerLinkState) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onError?: (message: string) => void;
  onTransport?: (transport: PeerTransport) => void;
}

export interface PeerLinkController {
  start: () => void;
  stop: () => void;
}

export interface SignalEnvelope {
  attemptId: string;
  payload: unknown;
}
