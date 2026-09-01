export interface SigMsg {
  seq: number;
  from: 'host' | 'guest';
  kind: string;
  data: unknown;
}

export class SignalingStoreUnavailableError extends Error {}
export class SignalingRateLimitError extends Error {}
export class SignalingSessionLimitError extends Error {}
