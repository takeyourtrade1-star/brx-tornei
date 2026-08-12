import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { buildLoginRedirectUrl, sanitizeRedirect } from '@/lib/auth/redirect';
import {
  BRIDGE_NONCE_COOKIE,
  isValidBridgeNonce,
} from '@/lib/auth/bridge-nonce';

export const dynamic = 'force-dynamic';

function redirectWithoutBridgeNonce(url: URL) {
  const response = NextResponse.redirect(url);
  response.cookies.set(BRIDGE_NONCE_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}

/** Valida il nonce emesso dal middleware prima di passare al refresh client coordinato. */

export async function GET(request: NextRequest) {
  const next = sanitizeRedirect(request.nextUrl.searchParams.get('next'));
  const loginUrl = new URL('/login', config.app.siteUrl);
  loginUrl.search = buildLoginRedirectUrl(next, '');

  const nonce = request.nextUrl.searchParams.get('nonce');
  const nonceCookie = request.cookies.get(BRIDGE_NONCE_COOKIE)?.value;
  if (!isValidBridgeNonce(nonce) || nonce !== nonceCookie) {
    return redirectWithoutBridgeNonce(loginUrl);
  }
  if (!request.cookies.has(config.auth.refreshCookie)) {
    return redirectWithoutBridgeNonce(loginUrl);
  }
  const continuation = new URL('/auth/bridge/continue', config.app.siteUrl);
  continuation.searchParams.set('next', next);
  continuation.searchParams.set('nonce', nonce);
  const response = NextResponse.redirect(continuation);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}
