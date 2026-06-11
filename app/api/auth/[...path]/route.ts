/**
 * Proxy verso il microservizio Auth — stesso pattern di new_frontend_brx.
 * Il browser chiama same-origin /api/auth/* (niente CORS); il proxy inoltra
 * ad AUTH_API_URL e converte i token in cookie HttpOnly (con Domain parent
 * in produzione → SSO bidirezionale col sito principale).
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

const ALLOWED_AUTH_PATHS = [
  'login',
  'login/code/request',
  'login/code/verify',
  'register',
  'refresh',
  'me',
  'logout',
  'verify-mfa',
  'password/reset',
  'password/reset/confirm',
];

function isAllowedPath(segments: string[]): boolean {
  const joined = segments.join('/');
  return ALLOWED_AUTH_PATHS.some(
    (allowed) => joined === allowed || joined.startsWith(`${allowed}/`)
  );
}

function extractTokens(payload: unknown): {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
} {
  if (!payload || typeof payload !== 'object') return {};
  const top = payload as Record<string, unknown>;
  const data = (top.data && typeof top.data === 'object' ? top.data : top) as Record<
    string,
    unknown
  >;
  return {
    accessToken: typeof data.access_token === 'string' ? data.access_token : undefined,
    refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
    expiresIn:
      typeof data.expires_in === 'number' && data.expires_in > 0
        ? Math.floor(data.expires_in)
        : undefined,
  };
}

function buildCookie(name: string, value: string, maxAge: number, secure: boolean): string {
  const domain = config.auth.cookieDomain ? `; Domain=${config.auth.cookieDomain}` : '';
  const secureFlag = secure ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${domain}${secureFlag}`;
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  if (!config.api.baseURL) {
    return NextResponse.json(
      { detail: 'NEXT_PUBLIC_AUTH_API_URL is not configured' },
      { status: 503 }
    );
  }
  if (!isAllowedPath(pathSegments)) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  const url = new URL(`/api/auth/${pathSegments.join('/')}`, config.api.baseURL);
  request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const auth = request.headers.get('authorization');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': request.headers.get('content-type') || 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }

  try {
    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));

    const responseHeaders = new Headers();
    responseHeaders.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');

    const isSecure =
      process.env.NODE_ENV === 'production' ||
      request.headers.get('x-forwarded-proto') === 'https';
    const { accessToken, refreshToken, expiresIn } = extractTokens(data);

    if (res.ok && accessToken) {
      responseHeaders.append(
        'Set-Cookie',
        buildCookie(
          config.auth.accessCookie,
          accessToken,
          expiresIn ?? config.auth.accessMaxAge,
          isSecure
        )
      );
      if (refreshToken) {
        responseHeaders.append(
          'Set-Cookie',
          buildCookie(config.auth.refreshCookie, refreshToken, config.auth.refreshMaxAge, isSecure)
        );
      }
    } else if (pathSegments[0] === 'logout') {
      responseHeaders.append(
        'Set-Cookie',
        buildCookie(config.auth.accessCookie, '', 0, isSecure)
      );
      responseHeaders.append(
        'Set-Cookie',
        buildCookie(config.auth.refreshCookie, '', 0, isSecure)
      );
    }

    return NextResponse.json(data, { status: res.status, headers: responseHeaders });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === 'TimeoutError';
    return NextResponse.json(
      { detail: isTimeout ? 'Request timed out' : 'Proxy request failed' },
      { status: 502 }
    );
  }
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxy(request, path);
}
