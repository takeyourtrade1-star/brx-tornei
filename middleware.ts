import { NextRequest, NextResponse } from 'next/server';
import { config as appConfig } from '@/lib/config';
import { buildLoginRedirectUrl } from '@/lib/auth/redirect';

/**
 * Protezione route.
 * - Sessione locale presente (access cookie) → avanti.
 * - Altrimenti → /login.
 *
 * Il login NON viene più propagato automaticamente dal marketplace: sul portale
 * tornei l'utente effettua SEMPRE un nuovo login. Niente SSO trasparente via
 * /auth/bridge dal cookie condiviso `.ebartex.com`.
 */

const ACCESS_COOKIE = appConfig.auth.accessCookie;

// `/tornei/webcam/[id]` è la pagina aperta dal telefono dopo la scansione del
// QR: deve essere raggiungibile senza login (il telefono non è autenticato).
const PUBLIC_PATHS = ['/login', '/registrati', '/tornei/webcam'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (request.cookies.has(ACCESS_COOKIE)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = buildLoginRedirectUrl(pathname, search);
  return NextResponse.redirect(url);
}

export const config = {
  // Tutto tranne API, asset statici e file con estensione (immagini, font, ecc.)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
