import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { clearSessionCookies, getRefreshToken, setSessionCookies } from '@/lib/auth/session';
import { buildLoginRedirectUrl, sanitizeRedirect } from '@/lib/auth/redirect';
import type { TokenResponse } from '@/types/auth';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';

export const dynamic = 'force-dynamic';

/**
 * Refresh bridge locale (vedi ARCHITECTURE.md §2.2).
 * Il middleware arriva qui quando questo host ha il refresh cookie `__Host-`
 * ma non un access token valido. Nessun cookie è condiviso tra sottodomini.
 */

export async function GET(request: NextRequest) {
  const next = sanitizeRedirect(request.nextUrl.searchParams.get('next'));
  const loginUrl = new URL('/login', config.app.siteUrl);
  loginUrl.search = buildLoginRedirectUrl(next, '');

  const refreshToken = await getRefreshToken();

  if (!refreshToken || !config.api.baseURL) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const res = await fetch(`${config.api.baseURL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(config.api.timeout),
    });

    const raw = (await readBoundedResponseJson(res, 256 * 1024).catch(
      () => ({}),
    )) as Record<string, unknown>;
    const body = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<
      string,
      unknown
    >;

    if (!res.ok || typeof body.access_token !== 'string') {
      // Refresh token rifiutato (revocato/scaduto): senza pulizia il middleware
      // rimanderebbe qui a ogni navigazione. Solo su 4xx espliciti — un errore
      // transitorio (5xx/timeout) non deve buttare via un token ancora valido.
      if (res.status >= 400 && res.status < 500) {
        await clearSessionCookies();
      }
      return NextResponse.redirect(loginUrl);
    }

    await setSessionCookies(body as unknown as TokenResponse);
    return NextResponse.redirect(new URL(next, config.app.siteUrl));
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}
