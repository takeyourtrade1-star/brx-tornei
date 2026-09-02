import 'server-only';

import type { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import {
  isValidAuthTokenPair,
  resolveAccessCookieMaxAge,
} from '@/lib/auth/auth-token';
import {
  SSO_NEXT_COOKIE,
  SSO_STATE_COOKIE,
  SSO_TRANSIENT_MAX_AGE_SECONDS,
  SSO_VERIFIER_COOKIE,
  type SsoTransaction,
} from '@/lib/auth/sso-handoff';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
};

export function hardenSsoResponse(response: NextResponse): NextResponse {
  response.headers.set(
    'Cache-Control',
    'private, no-store, max-age=0, must-revalidate',
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export function setSsoTransactionCookies(
  response: NextResponse,
  transaction: SsoTransaction,
): void {
  const options = {
    ...BASE_COOKIE_OPTIONS,
    maxAge: SSO_TRANSIENT_MAX_AGE_SECONDS,
  };
  response.cookies.set(SSO_STATE_COOKIE, transaction.state, options);
  response.cookies.set(SSO_VERIFIER_COOKIE, transaction.verifier, options);
  response.cookies.set(SSO_NEXT_COOKIE, transaction.next, options);
}

export function clearSsoTransactionCookies(response: NextResponse): void {
  const options = { ...BASE_COOKIE_OPTIONS, maxAge: 0 };
  response.cookies.set(SSO_STATE_COOKIE, '', options);
  response.cookies.set(SSO_VERIFIER_COOKIE, '', options);
  response.cookies.set(SSO_NEXT_COOKIE, '', options);
}

export function setSsoSessionCookies(
  response: NextResponse,
  payload: unknown,
): boolean {
  if (!isValidAuthTokenPair(payload)) return false;
  const accessMaxAge = resolveAccessCookieMaxAge(
    payload.access_token,
    payload.expires_in,
    config.auth.accessMaxAge,
  );
  response.cookies.set(config.auth.accessCookie, payload.access_token, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: accessMaxAge,
  });
  response.cookies.set(config.auth.refreshCookie, payload.refresh_token, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: config.auth.refreshMaxAge,
  });
  response.cookies.set(config.auth.preAuthCookie, '', {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return true;
}
