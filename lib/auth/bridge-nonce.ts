export const BRIDGE_NONCE_COOKIE = '__Host-ebartex_bridge_nonce';
export const BRIDGE_NONCE_MAX_AGE_SECONDS = 60;
export const BRIDGE_NONCE_PATTERN = /^[a-f0-9]{32}$/;

export function isValidBridgeNonce(value: unknown): value is string {
  return typeof value === 'string' && BRIDGE_NONCE_PATTERN.test(value);
}
