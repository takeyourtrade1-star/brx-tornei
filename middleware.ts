import { NextRequest, NextResponse } from 'next/server';
import { config as appConfig } from '@/lib/config';
import { buildLoginRedirectUrl } from '@/lib/auth/redirect';
import { isCanonicalRequestOrigin as matchesCanonicalOrigin } from '@/lib/security/canonical-origin';

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

function getTournamentWebSocketSource(): string | null {
  return appConfig.api.tournamentsWebSocketOrigin || null;
}

export function isCanonicalRequestOrigin(
  requestOrigin: string,
  configuredSiteUrl = appConfig.app.siteUrl,
): boolean {
  return matchesCanonicalOrigin(requestOrigin, configuredSiteUrl);
}

/** CSP per-request: nessuno script inline viene accettato senza il nonce. */
export function buildContentSecurityPolicy(nonce: string): string {
  const connectSources = [
    "'self'",
    getTournamentWebSocketSource(),
  ].filter((source): source is string => Boolean(source));

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://di0y87a9s8da9.cloudfront.net https://cards.scryfall.io https://svgs.scryfall.io",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    `connect-src ${connectSources.join(' ')}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function createPageResponse(
  request: NextRequest,
  responseFactory: (requestHeaders: Headers) => NextResponse = (requestHeaders) =>
    NextResponse.next({ request: { headers: requestHeaders } }),
): NextResponse {
  if (process.env.NODE_ENV === 'development') {
    const response = responseFactory(new Headers(request.headers));
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }

  const nonce = crypto.randomUUID().replaceAll('-', '');
  const csp = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  // Sovrascrive sempre header controllabili dal client.
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = responseFactory(requestHeaders);
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    process.env.NODE_ENV === 'production' &&
    !isCanonicalRequestOrigin(request.nextUrl.origin)
  ) {
    return new NextResponse('Misdirected Request', {
      status: 421,
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return createPageResponse(request);
  }

  if (request.cookies.has(ACCESS_COOKIE)) {
    return createPageResponse(request);
  }

  const url = new URL(request.nextUrl.pathname, appConfig.app.siteUrl);

  if (request.cookies.has(REFRESH_COOKIE)) {
    url.pathname = '/auth/bridge';
    url.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return createPageResponse(request, () => NextResponse.redirect(url));
  }

  url.pathname = '/login';
  url.search = buildLoginRedirectUrl(pathname, search);
  return createPageResponse(request, () => NextResponse.redirect(url));
}

export const config = {
  // La CSP copre ogni documento HTML. Non escludiamo genericamente gli slug
  // contenenti un punto, altrimenti diventerebbero un bypass della policy.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
