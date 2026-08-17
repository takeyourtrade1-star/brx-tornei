import 'server-only';

// Manteniamo margine sotto il limite tipico di 4096 byte per nome cookie e
// attributi. Sono ammessi soltanto caratteri ASCII sicuri per cookie/header.
export const AUTH_COOKIE_TOKEN_MAX_LENGTH = 3_800;
export const AUTH_COOKIE_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{1,3800}$/;

export interface ValidAuthTokenPair {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

export function isValidAuthCookieToken(value: unknown): value is string {
  return typeof value === 'string' && AUTH_COOKIE_TOKEN_PATTERN.test(value);
}

export function isValidAuthTokenPair(value: unknown): value is ValidAuthTokenPair {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isValidAuthCookieToken(candidate.access_token) &&
    isValidAuthCookieToken(candidate.refresh_token)
  );
}

/** TTL positivo, intero e mai superiore al massimo locale concordato. */
export function clampAuthCookieMaxAge(
  value: unknown,
  fallback: number,
  maximum = fallback,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.min(maximum, Math.max(1, Math.floor(value)));
}
