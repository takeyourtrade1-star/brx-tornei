import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { buildLoginRedirectUrl, sanitizeRedirect } from '@/lib/auth/redirect';
import {
  getSsoHandoffConfig,
  isValidSsoOpaqueValue,
  ssoStatesMatch,
  SSO_NEXT_COOKIE,
  SSO_STATE_COOKIE,
  SSO_TARGET_CLIENT_ID,
  SSO_VERIFIER_COOKIE,
} from '@/lib/auth/sso-handoff';
import {
  clearSsoTransactionCookies,
  hardenSsoResponse,
  setSsoSessionCookies,
} from '@/lib/auth/sso-response';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';

export const dynamic = 'force-dynamic';
const MAX_CALLBACK_QUERY_BYTES = 2_048;
const MAX_EXCHANGE_RESPONSE_BYTES = 16 * 1024;
const MAX_USER_AGENT_BYTES = 512;

function boundedUserAgent(request: NextRequest): string | null {
  const value = request.headers.get('user-agent');
  if (
    !value ||
    Buffer.byteLength(value, 'utf8') > MAX_USER_AGENT_BYTES ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return null;
  }
  return value;
}

function finishedRedirect(url: URL): NextResponse {
  const response = hardenSsoResponse(NextResponse.redirect(url));
  clearSsoTransactionCookies(response);
  return response;
}

function loginRedirect(next: string): NextResponse {
  const url = new URL('/login', config.app.siteUrl);
  url.search = buildLoginRedirectUrl(next, '');
  return finishedRedirect(url);
}

/** Consuma il code una sola volta, server-to-server, e crea cookie solo locali. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const next = sanitizeRedirect(request.cookies.get(SSO_NEXT_COOKIE)?.value);
  if (Buffer.byteLength(request.nextUrl.search, 'utf8') > MAX_CALLBACK_QUERY_BYTES) {
    return loginRedirect(next);
  }

  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get(SSO_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(SSO_VERIFIER_COOKIE)?.value;
  const code = request.nextUrl.searchParams.get('code');
  const ssoConfig = getSsoHandoffConfig();
  if (
    !ssoConfig ||
    request.nextUrl.searchParams.has('error') ||
    !ssoStatesMatch(state, expectedState) ||
    !isValidSsoOpaqueValue(verifier) ||
    !isValidSsoOpaqueValue(code)
  ) {
    return loginRedirect(next);
  }

  try {
    const userAgent = boundedUserAgent(request);
    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(ssoConfig.timeoutMs),
    ]);
    const upstream = await fetch(ssoConfig.exchangeUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
        'Content-Type': 'application/json',
        'X-SSO-Client-ID': SSO_TARGET_CLIENT_ID,
        'X-SSO-Client-Secret': ssoConfig.clientSecret,
        ...(userAgent ? { 'User-Agent': userAgent } : {}),
      },
      body: JSON.stringify({
        code,
        code_verifier: verifier,
        redirect_uri: ssoConfig.callbackUrl,
      }),
      cache: 'no-store',
      redirect: 'error',
      signal,
    });
    if (
      !upstream.ok ||
      !upstream.headers.get('content-type')?.toLowerCase().startsWith('application/json')
    ) {
      await upstream.body?.cancel().catch(() => undefined);
      return loginRedirect(next);
    }

    const payload = await readBoundedResponseJson(
      upstream,
      MAX_EXCHANGE_RESPONSE_BYTES,
      signal,
    );
    const response = hardenSsoResponse(
      NextResponse.redirect(new URL(next, config.app.siteUrl)),
    );
    if (!setSsoSessionCookies(response, payload)) return loginRedirect(next);
    clearSsoTransactionCookies(response);
    return response;
  } catch {
    return loginRedirect(next);
  }
}
