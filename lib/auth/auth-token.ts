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

/**
 * Il backend Auth emette access JWT da 60 minuti ma non dichiara `expires_in`.
 * Il cookie non deve sopravvivere al JWT (me → 401 con cookie ancora presente
 * → redirect al login senza passare dal bridge) né morire molto prima (bridge
 * refresh ogni 5 minuti = rotazioni inutili del refresh token single-use).
 */
export const ACCESS_COOKIE_MAX_TTL_SECONDS = 3_660;
export const ACCESS_COOKIE_EARLY_EXPIRY_SECONDS = 90;
const ACCESS_COOKIE_MIN_TTL_SECONDS = 30;
const ACCESS_TOKEN_EXP_LIMIT_SECONDS = 7 * 86_400;

/** Legge il claim `exp` senza verificare la firma: il backend resta arbitro. */
function parseAccessTokenExpiry(token: string): number | null {
  const segments = token.split('.');
  if (segments.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(segments[1], 'base64url').toString('utf8'),
    ) as { exp?: unknown };
    const exp = payload?.exp;
    if (
      typeof exp !== 'number' ||
      !Number.isFinite(exp) ||
      exp <= 0 ||
      exp > Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXP_LIMIT_SECONDS
    ) {
      return null;
    }
    return exp;
  } catch {
    return null;
  }
}

/**
 * TTL del cookie access: dall'`exp` reale del JWT (con margine perché il
 * bridge scatti mentre il token è ancora valido), altrimenti dal comportamento
 * storico (`expires_in` dichiarato o fallback locale).
 */
export function resolveAccessCookieMaxAge(
  accessToken: string,
  expiresIn: unknown,
  fallback: number,
): number {
  const exp = parseAccessTokenExpiry(accessToken);
  if (exp !== null) {
    const remaining = exp - Math.floor(Date.now() / 1000) - ACCESS_COOKIE_EARLY_EXPIRY_SECONDS;
    return Math.min(
      ACCESS_COOKIE_MAX_TTL_SECONDS,
      Math.max(ACCESS_COOKIE_MIN_TTL_SECONDS, Math.floor(remaining)),
    );
  }
  return clampAuthCookieMaxAge(expiresIn, fallback, fallback);
}
