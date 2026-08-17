import 'server-only';

import type { NextRequest } from 'next/server';
import { config } from '@/lib/config';
import { isValidAuthCookieToken } from '@/lib/auth/auth-token';
import { isJsonContentType, readBoundedText } from '@/lib/security/bounded-json';

export const MAX_AUTH_BODY_BYTES = 64 * 1024;
export const MAX_AUTH_QUERY_BYTES = 2_048;

export class AuthProxyRequestError extends Error {
  constructor(
    readonly status: 400 | 401 | 408 | 413 | 415,
    readonly detail: string,
  ) {
    super(detail);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export async function readAuthRequestBody(
  request: NextRequest,
  path: string,
): Promise<string | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  if (!isJsonContentType(request.headers.get('content-type'))) {
    throw new AuthProxyRequestError(415, 'JSON content type required');
  }
  const decoded = await readBoundedText(request, MAX_AUTH_BODY_BYTES, {
    timeoutMs: 10_000,
  });
  if (!decoded.ok) {
    if (decoded.status === 408) {
      throw new AuthProxyRequestError(408, 'Request body timed out');
    }
    if (decoded.status === 413) {
      throw new AuthProxyRequestError(413, 'Payload too large');
    }
    throw new AuthProxyRequestError(400, 'Invalid request body');
  }

  let parsed: Record<string, unknown>;
  try {
    const record = asRecord(JSON.parse(decoded.value || '{}') as unknown);
    if (!record) throw new Error('body must be an object');
    parsed = record;
  } catch {
    throw new AuthProxyRequestError(400, 'Invalid request body');
  }
  delete parsed.access_token;
  delete parsed.refresh_token;
  delete parsed.pre_auth_token;

  if (path === 'refresh' || path === 'logout') {
    const refreshToken = request.cookies.get(config.auth.refreshCookie)?.value;
    if (path === 'refresh' && !isValidAuthCookieToken(refreshToken)) {
      throw new AuthProxyRequestError(401, 'Refresh session unavailable');
    }
    return JSON.stringify(
      isValidAuthCookieToken(refreshToken) ? { refresh_token: refreshToken } : {},
    );
  }
  if (path === 'verify-mfa') {
    const preAuthToken = request.cookies.get(config.auth.preAuthCookie)?.value;
    if (!isValidAuthCookieToken(preAuthToken)) {
      throw new AuthProxyRequestError(401, 'MFA session unavailable');
    }
    if (
      typeof parsed.mfa_code !== 'string' ||
      !/^\d{6}$/.test(parsed.mfa_code) ||
      (parsed.remember_device !== undefined && typeof parsed.remember_device !== 'boolean')
    ) {
      throw new AuthProxyRequestError(400, 'Invalid MFA request');
    }
    return JSON.stringify({
      mfa_code: parsed.mfa_code,
      remember_device: parsed.remember_device === true,
      pre_auth_token: preAuthToken,
    });
  }
  return JSON.stringify(parsed);
}
