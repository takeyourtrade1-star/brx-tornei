import { NextRequest, NextResponse } from 'next/server';
import { config as appConfig } from '@/lib/config';
import { isAccessTokenExpired } from '@/lib/auth/token';

/**
 * Protezione route + innesto SSO.
 * - Access token valido (non scaduto) → avanti.
 * - Access assente/scaduto + refresh cookie (es. login su ebartex.com con
 *   Domain=.ebartex.com) → /auth/bridge per il login trasparente.
 * - Nessun refresh valido → /login (con `next` per riprendere il flusso).
 */

const ACCESS_COOKIE = appConfig.auth.accessCookie;
const REFRESH_COOKIE = appConfig.auth.refreshCookie;

// Route pubbliche: hub navigabile senza login; login al click sul formato.
const PUBLIC_PATHS = [
  '/login',
  '/registrati',
  '/auth/bridge',
  '/tornei/webcam',
  '/hub',
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const accessValid = access && !isAccessTokenExpired(access);

  if (accessValid) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const returnTo = `${pathname}${search}`;

  if (refresh) {
    url.pathname = '/auth/bridge';
    url.search = `next=${encodeURIComponent(returnTo)}`;
  } else {
    url.pathname = '/login';
    url.search =
      returnTo && returnTo !== '/'
        ? `next=${encodeURIComponent(returnTo)}`
        : '';
  }
  return NextResponse.redirect(url);
}

export const config = {
  // Tutto tranne API, asset statici e file con estensione (immagini, font, ecc.)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
