/**
 * Lettura leggera del JWT access token (solo claim `exp`, senza verifica firma).
 * Usata dal middleware per capire se tentare il refresh SSO via /auth/bridge.
 */

const EXPIRY_LEEWAY_SEC = 30;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** true se il token è assente, malformato o scaduto (con margine). */
export function isAccessTokenExpired(token: string | undefined | null): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  const exp = payload.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return false;
  return exp * 1000 <= Date.now() + EXPIRY_LEEWAY_SEC * 1000;
}
