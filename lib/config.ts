/**
 * Application Configuration — Ebartex Tournaments
 * Stesso pattern di new_frontend_brx/lib/config.ts.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const normalizeURL = (url: string): string => url.replace(/\/+$/, '');

/**
 * URL del microservizio di autenticazione (FastAPI su AWS) — lo stesso del sito principale.
 *
 * NB: niente throw a livello di modulo. Durante `next build` Next importa le route
 * per la raccolta dati (NODE_ENV=production) e un throw qui rompe la build anche
 * quando la variabile sarà presente a runtime. I consumer gestiscono già il caso
 * baseURL vuoto (proxy → 503, bridge → redirect /login, action → errore tipizzato).
 */
const getAuthApiURL = (): string => {
  const envUrl =
    process.env.NEXT_PUBLIC_AUTH_API_URL || process.env.AUTH_API_URL || '';
  if (!envUrl) {
    console.warn('[Config] NEXT_PUBLIC_AUTH_API_URL non configurato (vedi .env.example).');
    return '';
  }
  return normalizeURL(envUrl);
};

/** CDN asset condivisi (CloudFront). Stesso fallback dev del sito principale. */
const EBARTEX_CDN_FALLBACK_DEV = 'https://di0y87a9s8da9.cloudfront.net';
const cdnBase = normalizeURL(
  process.env.NEXT_PUBLIC_CDN_URL || (isDevelopment ? EBARTEX_CDN_FALLBACK_DEV : '')
);

export const ASSETS = {
  cdnUrl: cdnBase,
  imagesBaseUrl: cdnBase ? `${cdnBase}/images` : '',
} as const;

/** Logo ufficiale Ebartex — asset locale in public/images/. */
export const SITE_LOGO_SRC = '/images/logo-ufficiale.png' as const;

/** URL immagine UI condivisa (icone) dal CDN Ebartex. */
export function getCdnImageUrl(path: string): string {
  const p = path.replace(/^\/+/, '');
  if (ASSETS.imagesBaseUrl) return `${ASSETS.imagesBaseUrl}/${p}`;
  return `/images/${p}`;
}

export const config = {
  api: {
    baseURL: getAuthApiURL(),
    timeout: 30000,
  },
  auth: {
    /** Stessi nomi cookie del proxy del sito principale → SSO cross-subdomain. */
    accessCookie: 'ebartex_access_token',
    refreshCookie: 'ebartex_refresh_token',
    /** In produzione: ".ebartex.com". In locale: vuoto (host-only). */
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN || '',
    accessMaxAge: 60 * 60 * 24, // fallback 24h se il backend non manda expires_in
    refreshMaxAge: 60 * 60 * 24 * 30, // 30 giorni
  },
  app: {
    name: 'Ebartex Tornei',
    /** URL pubblico di questo sito (sottodominio tornei). */
    siteUrl: normalizeURL(
      process.env.NEXT_PUBLIC_SITE_URL || 'https://tournaments.ebartex.com'
    ),
    mainSiteUrl: normalizeURL(
      process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://www.ebartex.com'
    ),
  },
  debug: {
    isDevelopment,
  },
} as const;
