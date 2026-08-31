import 'server-only';

import { config } from '@/lib/config';
import {
  clampAuthCookieMaxAge,
  isValidAuthCookieToken,
} from '@/lib/auth/auth-token';
import type { AuthBrowserOutcome } from '@/lib/auth/bff-redaction';

type AllowedMethod = 'GET' | 'POST';

const EXACT_AUTH_ROUTES: Readonly<Record<string, readonly AllowedMethod[]>> = {
  login: ['POST'],
  'login/code/request': ['POST'],
  'login/code/verify': ['POST'],
  register: ['POST'],
  refresh: ['POST'],
  me: ['GET'],
  logout: ['POST'],
  'verify-mfa': ['POST'],
};

// Register restituisce UserResponse/RegistrationPendingResponse nel contratto
// Auth corrente: non e' un issuer di credenziali di sessione.
const SESSION_TOKEN_ISSUERS = new Set([
  'login', 'login/code/verify', 'refresh', 'verify-mfa',
]);
const PREAUTH_TOKEN_ISSUERS = new Set(['login', 'login/code/verify']);

const EXACT_CREDENTIAL_FIELDS = new Set([
  'access_token', 'refresh_token', 'pre_auth_token',
]);
const CREDENTIAL_ALIASES = new Set([
  'accesstoken', 'refreshtoken', 'preauthtoken', 'idtoken',
  'authorization', 'jwt', 'token',
]);

export interface ValidatedAuthResponse {
  valid: boolean;
  outcome: AuthBrowserOutcome;
  accessToken?: string;
  refreshToken?: string;
  preAuthToken?: string;
  accessMaxAge?: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function containsUnexpectedCredentialField(
  value: unknown,
  allowedContainer: Record<string, unknown> | null,
  depth = 0,
): boolean {
  if (depth > 8) return true;
  if (Array.isArray(value)) {
    return value.some((child) =>
      containsUnexpectedCredentialField(child, allowedContainer, depth + 1),
    );
  }
  const record = asRecord(value);
  if (!record) return false;
  for (const [key, child] of Object.entries(record)) {
    const lower = key.toLowerCase();
    const normalized = lower.replace(/[_-]/g, '');
    if (EXACT_CREDENTIAL_FIELDS.has(lower)) {
      if (record !== allowedContainer) return true;
    } else if (CREDENTIAL_ALIASES.has(normalized)) {
      return true;
    }
    if (containsUnexpectedCredentialField(child, allowedContainer, depth + 1)) {
      return true;
    }
  }
  return false;
}

export function isAllowedAuthRoute(path: string, method: string): boolean {
  return EXACT_AUTH_ROUTES[path]?.includes(method as AllowedMethod) === true;
}

export function validateSuccessfulAuthResponse(
  path: string,
  payload: unknown,
): ValidatedAuthResponse {
  const root = asRecord(payload);
  if (!root) return { valid: false, outcome: 'none' };
  const nested = asRecord(root.data);
  const candidates = [root, nested].filter(
    (candidate): candidate is Record<string, unknown> =>
      candidate !== null && [...EXACT_CREDENTIAL_FIELDS].some((key) =>
        Object.prototype.hasOwnProperty.call(candidate, key),
      ),
  );
  if (candidates.length > 1) return { valid: false, outcome: 'none' };
  const credentials = candidates[0] ?? null;
  if (containsUnexpectedCredentialField(payload, credentials)) {
    return { valid: false, outcome: 'none' };
  }
  if (!credentials) {
    return SESSION_TOKEN_ISSUERS.has(path)
      ? { valid: false, outcome: 'none' }
      : { valid: true, outcome: 'none' };
  }

  const hasAccess = Object.prototype.hasOwnProperty.call(credentials, 'access_token');
  const hasRefresh = Object.prototype.hasOwnProperty.call(credentials, 'refresh_token');
  const hasPreAuth = Object.prototype.hasOwnProperty.call(credentials, 'pre_auth_token');
  if (hasAccess || hasRefresh) {
    if (
      !SESSION_TOKEN_ISSUERS.has(path) || hasPreAuth || !hasAccess || !hasRefresh ||
      !isValidAuthCookieToken(credentials.access_token) ||
      !isValidAuthCookieToken(credentials.refresh_token)
    ) {
      return { valid: false, outcome: 'none' };
    }
    return {
      valid: true,
      outcome: 'session',
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token,
      accessMaxAge: clampAuthCookieMaxAge(
        credentials.expires_in,
        config.auth.accessMaxAge,
        config.auth.accessMaxAge,
      ),
    };
  }
  if (
    hasPreAuth && PREAUTH_TOKEN_ISSUERS.has(path) &&
    isValidAuthCookieToken(credentials.pre_auth_token) &&
    credentials.mfa_required === true
  ) {
    return {
      valid: true,
      outcome: 'preauth',
      preAuthToken: credentials.pre_auth_token,
    };
  }
  return { valid: false, outcome: 'none' };
}
