import { NextRequest, NextResponse } from 'next/server';
import { config as appConfig } from '@/lib/config';
import { isProtectedPath, isPublicPath } from '@/lib/auth/routes';

/**
 * Protezione route selettiva + innesco SSO.
 * - Route pubbliche (home, hub, tornei, auth) → accessibili senza login.
 * - Route protette (mazzi, partite) → sessione obbligatoria.
 * - Solo refresh cookie su route protette → /auth/bridge per SSO trasparente.
 */

const ACCESS_COOKIE = appConfig.auth.accessCookie;
const REFRESH_COOKIE = appConfig.auth.refreshCookie;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
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
    url.search = `next=${encodeURIComponent(pathname + search)}`;
  }
  return NextResponse.redirect(url);
}

export const config = {
  // Tutto tranne API, asset statici e file con estensione (immagini, font, ecc.)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
