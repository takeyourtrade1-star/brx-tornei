import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { buildLoginRedirectUrl, sanitizeRedirect } from '@/lib/auth/redirect';
import { isValidAuthCookieToken } from '@/lib/auth/auth-token';
import {
  createSsoTransaction,
  getSsoHandoffConfig,
  SSO_TARGET_CLIENT_ID,
} from '@/lib/auth/sso-handoff';
import {
  hardenSsoResponse,
  setSsoTransactionCookies,
} from '@/lib/auth/sso-response';

export const dynamic = 'force-dynamic';

function loginRedirect(next: string): NextResponse {
  const url = new URL('/login', config.app.siteUrl);
  url.search = buildLoginRedirectUrl(next, '');
  return hardenSsoResponse(NextResponse.redirect(url));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const next = sanitizeRedirect(request.nextUrl.searchParams.get('next'));
  const ssoConfig = getSsoHandoffConfig();
  if (!ssoConfig) return loginRedirect(next);

  const transaction = createSsoTransaction(next);
  const authorizeUrl = new URL(ssoConfig.authorizeUrl);
  authorizeUrl.searchParams.set('client_id', SSO_TARGET_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', ssoConfig.callbackUrl);
  authorizeUrl.searchParams.set('state', transaction.state);
  authorizeUrl.searchParams.set('code_challenge', transaction.challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  const response = hardenSsoResponse(NextResponse.redirect(authorizeUrl));
  setSsoTransactionCookies(response, transaction);
  return response;
}
