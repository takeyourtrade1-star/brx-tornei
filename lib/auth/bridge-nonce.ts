export const BRIDGE_NONCE_COOKIE = '__Host-ebartex_bridge_nonce';
// La finestra deve coprire l'intero flusso client (me + lock retry + refresh
// 30s) anche su rete lenta: un expiry troppo breve trasforma un refresh lento
// in un login forzato alla scadenza del nonce.
export const BRIDGE_NONCE_MAX_AGE_SECONDS = 180;
export const BRIDGE_NONCE_PATTERN = /^[a-f0-9]{32}$/;

export function isValidBridgeNonce(value: unknown): value is string {
  return typeof value === 'string' && BRIDGE_NONCE_PATTERN.test(value);
}
