import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { redactAuthPayload } from '@/lib/auth/bff-redaction';
import {
  buildTrustedDeviceRequestCookie,
  getTrustedDeviceAuthPolicy,
  getSetCookieHeaders,
  MFA_TRUST_COOKIE,
  parseTrustedDeviceSetCookies,
  serializeTrustedDeviceCookie,
} from '@/lib/auth/trusted-device-cookie';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';
import { readBoundedText } from '@/lib/security/bounded-json';
import { isSameOriginMutation } from '@/lib/security/request-origin';

export const dynamic = 'force-dynamic';
const MAX_BODY_BYTES = 64 * 1024;
const MAX_QUERY_BYTES = 2048;
const ALLOWED_AUTH_PATHS = new Set([
  'login', 'login/code/request', 'login/code/verify', 'register', 'refresh',
  'me', 'logout', 'verify-mfa', 'password/reset', 'password/reset/confirm',
]);

interface ExtractedTokens {
  accessToken?: string;
  refreshToken?: string;
  preAuthToken?: string;
  expiresIn?: number;
}

function extractTokens(payload: unknown): ExtractedTokens {
  if (!payload || typeof payload !== 'object') return {};
  const top = payload as Record<string, unknown>;
  const data = (top.data && typeof top.data === 'object' ? top.data : top) as Record<string, unknown>;
  return {
    accessToken: typeof data.access_token === 'string' ? data.access_token : undefined,
    refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
    preAuthToken: typeof data.pre_auth_token === 'string' ? data.pre_auth_token : undefined,
    expiresIn: typeof data.expires_in === 'number' && data.expires_in > 0
      ? Math.floor(data.expires_in) : undefined,
  };
}

function buildCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

async function requestBody(request: NextRequest, path: string): Promise<string | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  const decoded = await readBoundedText(request, MAX_BODY_BYTES);
  if (!decoded.ok) {
    if (decoded.status === 413) throw new RangeError('body');
    throw new SyntaxError('body');
  }
  const raw = decoded.value;
  if (!['refresh', 'logout', 'verify-mfa'].includes(path)) return raw;
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(raw || '{}') as Record<string, unknown>; } catch { /* upstream returns 422 */ }
  if (path === 'refresh' || path === 'logout') {
    const refresh = request.cookies.get(config.auth.refreshCookie)?.value;
    delete parsed.refresh_token;
    if (refresh) parsed.refresh_token = refresh;
  }
  if (path === 'verify-mfa') {
    const preAuth = request.cookies.get(config.auth.preAuthCookie)?.value;
    delete parsed.pre_auth_token;
    if (preAuth) parsed.pre_auth_token = preAuth;
  }
  return JSON.stringify(parsed);
}

async function proxy(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const path = pathSegments.join('/');
  if (!ALLOWED_AUTH_PATHS.has(path)) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return NextResponse.json({ detail: 'Cross-site request rejected' }, { status: 403 });
  }
  if (!config.api.baseURL) {
    return NextResponse.json({ detail: 'Auth service unavailable' }, { status: 503 });
  }
  if (Buffer.byteLength(request.nextUrl.search, 'utf8') > MAX_QUERY_BYTES) {
    return NextResponse.json({ detail: 'Query too large' }, { status: 414 });
  }
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ detail: 'Payload too large' }, { status: 413 });
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
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...(trustedCookie ? { Cookie: trustedCookie } : {}),
    ...(policy.forwardUserAgent && request.headers.get('user-agent')
      ? { 'User-Agent': request.headers.get('user-agent')! } : {}),
  };

  try {
    const body = await requestBody(request, path);
    const upstream = await fetch(new URL(authPath, config.api.baseURL), {
      method: request.method, headers, body, cache: 'no-store', redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const data = await readBoundedResponseJson(upstream, 1024 * 1024).catch(() => ({}));
    const responseHeaders = new Headers({
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    });
    const trustedUpdate = policy.acceptSetCookie
      ? parseTrustedDeviceSetCookies(getSetCookieHeaders(upstream.headers)) : null;
    if (trustedUpdate) responseHeaders.append('Set-Cookie', serializeTrustedDeviceCookie(trustedUpdate));

    const { accessToken, refreshToken, preAuthToken, expiresIn } = extractTokens(data);
    if (upstream.ok && accessToken) {
      responseHeaders.append('Set-Cookie', buildCookie(
        config.auth.accessCookie, accessToken, expiresIn ?? config.auth.accessMaxAge,
      ));
      if (refreshToken) responseHeaders.append('Set-Cookie', buildCookie(
        config.auth.refreshCookie, refreshToken, config.auth.refreshMaxAge,
      ));
    }
    if (upstream.ok && preAuthToken) responseHeaders.append('Set-Cookie', buildCookie(
      config.auth.preAuthCookie, preAuthToken, 600,
    ));
    if (path === 'logout') {
      responseHeaders.append('Set-Cookie', buildCookie(config.auth.accessCookie, '', 0));
      responseHeaders.append('Set-Cookie', buildCookie(config.auth.refreshCookie, '', 0));
      responseHeaders.append('Set-Cookie', buildCookie(config.auth.preAuthCookie, '', 0));
    }
    return NextResponse.json(redactAuthPayload(data), {
      status: upstream.status, headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof RangeError) {
      return NextResponse.json({ detail: 'Payload too large' }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ detail: 'Auth service unavailable' }, { status: 502 });
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
