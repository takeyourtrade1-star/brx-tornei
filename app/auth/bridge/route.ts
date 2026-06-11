import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getRefreshToken, setSessionCookies } from '@/lib/auth/session';
import type { TokenResponse } from '@/types/auth';

export const dynamic = 'force-dynamic';

/**
 * SSO Bridge (vedi ARCHITECTURE.md §2.2).
 * L'utente arriva qui dal middleware quando ha il cookie ebartex_refresh_token
 * (impostato dal sito principale con Domain=.ebartex.com) ma nessuna sessione locale.
 * Tenta il refresh → se ok imposta i cookie di sessione e prosegue: login invisibile.
 */

/** Solo path relativi interni: evita open redirect. */
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/hub';
  return next;
}

export async function GET(request: NextRequest) {
  const next = sanitizeNext(request.nextUrl.searchParams.get('next'));
  const loginUrl = new URL('/login', request.url);
  const refreshToken = await getRefreshToken();

  if (!refreshToken || !config.api.baseURL) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const res = await fetch(`${config.api.baseURL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(config.api.timeout),
    });

    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const body = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<
      string,
      unknown
    >;

    if (!res.ok || typeof body.access_token !== 'string') {
      // Refresh token scaduto/revocato → login esplicito.
      return NextResponse.redirect(loginUrl);
    }

    await setSessionCookies(body as unknown as TokenResponse);
    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}
