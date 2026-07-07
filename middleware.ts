import { NextRequest, NextResponse } from 'next/server';
import { config as appConfig } from '@/lib/config';
import { buildLoginRedirectUrl } from '@/lib/auth/redirect';

/**
 * Protezione route.
 * - Sessione locale presente (access cookie) → avanti.
 * - Access scaduto ma refresh cookie presente → /auth/bridge (refresh
 *   silenzioso, poi torna alla pagina richiesta).
 * - Altrimenti → /login.
 *
 * Il login NON viene più propagato automaticamente dal marketplace: sul portale
 * tornei l'utente effettua SEMPRE un nuovo login. Il bridge serve solo a
 * rinnovare la sessione locale col refresh token già emesso qui.
 */

const ACCESS_COOKIE = appConfig.auth.accessCookie;
const REFRESH_COOKIE = appConfig.auth.refreshCookie;

// `/tornei/webcam/[id]` è la pagina aperta dal telefono dopo la scansione del
// QR: deve essere raggiungibile senza login (il telefono non è autenticato).
// `/auth/bridge` è la destinazione del refresh silenzioso: senza eccezione
// il middleware la rimbalzerebbe a /login prima che possa rinnovare i cookie.
const PUBLIC_PATHS = ['/login', '/registrati', '/tornei/webcam', '/auth/bridge'];

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
    url.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }

  url.pathname = '/login';
  url.search = buildLoginRedirectUrl(pathname, search);
  return NextResponse.redirect(url);
}

export const config = {
  // Tutto tranne API, asset statici e file con estensione (immagini, font, ecc.)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
