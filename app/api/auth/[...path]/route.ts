import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { projectAuthPayload } from '@/lib/auth/bff-redaction';
import { isValidAuthCookieToken } from '@/lib/auth/auth-token';
import {
  authRateLimitForPath,
  isAllowedAuthRoute,
  requiresDistributedAuthRateLimit,
  validateSuccessfulAuthResponse,
  type ValidatedAuthResponse,
} from '@/lib/auth/auth-bff-contract';
import {
  AuthProxyRequestError,
  MAX_AUTH_BODY_BYTES,
  MAX_AUTH_QUERY_BYTES,
  readAuthRequestBody,
} from '@/lib/auth/auth-bff-request';
import { PRE_AUTH_MAX_AGE } from '@/lib/auth/pre-auth-cookie';
import {
  buildTrustedDeviceRequestCookie,
  getTrustedDeviceAuthPolicy,
  getSetCookieHeaders,
  MFA_TRUST_COOKIE,
  parseTrustedDeviceSetCookies,
  serializeTrustedDeviceCookie,
} from '@/lib/auth/trusted-device-cookie';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import { getRateLimitClientIp } from '@/lib/security/client-ip';
import {
  enforceServerRateLimit,
  statusForServerRateLimitError,
} from '@/lib/security/server-rate-limit';

export const dynamic = 'force-dynamic';

function buildCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function noStoreHeaders(headers = new Headers()): Headers {
  headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  return headers;
}

function authJson(
  payload: Record<string, unknown>,
  status: number,
  headers = new Headers(),
): NextResponse {
  return NextResponse.json(payload, { status, headers: noStoreHeaders(headers) });
}

function appendSessionDeletions(headers: Headers): void {
  headers.append('Set-Cookie', buildCookie(config.auth.accessCookie, '', 0));
  headers.append('Set-Cookie', buildCookie(config.auth.refreshCookie, '', 0));
  headers.append('Set-Cookie', buildCookie(config.auth.preAuthCookie, '', 0));
}

async function proxy(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const path = pathSegments.join('/');
  if (!isAllowedAuthRoute(path, request.method)) {
    return authJson({ detail: 'Not found' }, 404);
  }
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return authJson({ detail: 'Cross-site request rejected' }, 403);
  }
  if (Buffer.byteLength(request.nextUrl.search, 'utf8') > MAX_AUTH_QUERY_BYTES) {
    return authJson({ detail: 'Query too large' }, 414);
  }
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_AUTH_BODY_BYTES) {
    return authJson({ detail: 'Payload too large' }, 413);
  }
  const localLimit = authRateLimitForPath(path);
  if (localLimit !== undefined) {
    try {
      await enforceServerRateLimit({
        scope: `auth-proxy:${path}`,
        subject: getRateLimitClientIp(request),
        limit: localLimit,
        requireDistributedStore: requiresDistributedAuthRateLimit(path),
      });
    } catch (error) {
      const status = statusForServerRateLimitError(error);
      const responseHeaders = new Headers(
        status === 429 ? { 'Retry-After': '60' } : {},
      );
      if (path === 'logout') appendSessionDeletions(responseHeaders);
      return authJson(
        { detail: status === 429 ? 'Too many attempts' : 'Auth service unavailable' },
        status,
        responseHeaders,
      );
    }
  }

  if (!config.api.baseURL) {
    if (path === 'logout') {
      const responseHeaders = new Headers();
      appendSessionDeletions(responseHeaders);
      return authJson({ logged_out: true }, 200, responseHeaders);
    }
    return authJson({ detail: 'Auth service unavailable' }, 503);
  }

  const authPath = `/api/auth/${path}`;
  const policy = getTrustedDeviceAuthPolicy(authPath);
  const trustedCookie = buildTrustedDeviceRequestCookie(
    policy.forwardCookie ? request.cookies.get(MFA_TRUST_COOKIE)?.value : undefined,
  );
  const access = request.cookies.get(config.auth.accessCookie)?.value;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Encoding': 'identity',
    ...(isValidAuthCookieToken(access) ? { Authorization: `Bearer ${access}` } : {}),
    ...(trustedCookie ? { Cookie: trustedCookie } : {}),
    ...(policy.forwardUserAgent && request.headers.get('user-agent')
      ? { 'User-Agent': request.headers.get('user-agent')! } : {}),
  };

  try {
    const body = await readAuthRequestBody(request, path);
    const upstreamSignal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(15_000),
    ]);
    const upstream = await fetch(new URL(authPath, config.api.baseURL), {
      method: request.method, headers, body, cache: 'no-store', redirect: 'error',
      signal: upstreamSignal,
    });
    const data = await readBoundedResponseJson(upstream, 512 * 1024, upstreamSignal);
    const responseHeaders = new Headers({
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    });

    if (path === 'logout') {
      appendSessionDeletions(responseHeaders);
      return authJson({ logged_out: true }, 200, responseHeaders);
    }

    let validated: ValidatedAuthResponse = { valid: true, outcome: 'none' };
    if (upstream.ok) {
      validated = validateSuccessfulAuthResponse(path, data);
      if (!validated.valid) {
        return authJson({ detail: 'Auth service returned an invalid response' }, 502);
      }
    }

    const trustedUpdate = policy.acceptSetCookie
      ? parseTrustedDeviceSetCookies(getSetCookieHeaders(upstream.headers)) : null;
    if (trustedUpdate) responseHeaders.append('Set-Cookie', serializeTrustedDeviceCookie(trustedUpdate));

    if (path === 'login' || path === 'login/code/verify') {
      responseHeaders.append(
        'Set-Cookie',
        buildCookie(config.auth.preAuthCookie, '', 0),
      );
    }
    if (validated.outcome === 'preauth' && validated.preAuthToken) {
      responseHeaders.append('Set-Cookie', buildCookie(
        config.auth.preAuthCookie,
        validated.preAuthToken,
        PRE_AUTH_MAX_AGE,
      ));
    }
    if (
      validated.outcome === 'session' &&
      validated.accessToken &&
      validated.refreshToken
    ) {
      responseHeaders.append('Set-Cookie', buildCookie(
        config.auth.accessCookie,
        validated.accessToken,
        validated.accessMaxAge ?? config.auth.accessMaxAge,
      ));
      responseHeaders.append('Set-Cookie', buildCookie(
        config.auth.refreshCookie,
        validated.refreshToken,
        config.auth.refreshMaxAge,
      ));
      if (path !== 'login' && path !== 'login/code/verify') {
        responseHeaders.append(
          'Set-Cookie',
          buildCookie(config.auth.preAuthCookie, '', 0),
        );
      }
    }

    return authJson(
      projectAuthPayload(path, data, {
        ok: upstream.ok,
        outcome: validated.outcome,
      }),
      upstream.status,
      responseHeaders,
    );
  } catch (error) {
    if (error instanceof AuthProxyRequestError) {
      const responseHeaders = new Headers();
      if (path === 'logout') appendSessionDeletions(responseHeaders);
      return authJson({ detail: error.detail }, error.status, responseHeaders);
    }
    if (path === 'logout') {
      const responseHeaders = new Headers();
      appendSessionDeletions(responseHeaders);
      return authJson({ logged_out: true }, 200, responseHeaders);
    }
    return authJson({ detail: 'Auth service unavailable' }, 502);
  }
}

type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function POST(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function PUT(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function DELETE(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
