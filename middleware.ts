import { NextRequest, NextResponse } from 'next/server';
import { config as appConfig } from '@/lib/config';

/**
 * Protezione route + innesco SSO.
 * - Sessione presente (access cookie) → avanti.
 * - Solo refresh cookie (es. utente loggato sul sito principale, Domain=.ebartex.com)
 *   → /auth/bridge per il login trasparente.
 * - Nessuno dei due → /login.
 */

const ACCESS_COOKIE = appConfig.auth.accessCookie;
const REFRESH_COOKIE = appConfig.auth.refreshCookie;

const PUBLIC_PATHS = ['/login', '/registrati', '/auth/bridge'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (request.cookies.has(ACCESS_COOKIE)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  if (request.cookies.has(REFRESH_COOKIE)) {
    url.pathname = '/auth/bridge';
    url.search = `next=${encodeURIComponent(pathname + search)}`;
  } else {
    url.pathname = '/login';
    url.search = '';
  }
  return NextResponse.redirect(url);
}

export const config = {
  // Tutto tranne API, asset statici e file con estensione (immagini, font, ecc.)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
