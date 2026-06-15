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

/** URL del microservizio Sync (BRX Sync) — usato per l'inventario utente. */
const getSyncApiURL = (): string => {
  const envUrl =
    process.env.NEXT_PUBLIC_SYNC_API_URL || process.env.SYNC_API_URL || '';
  if (!envUrl && isDevelopment) {
    console.warn('[Config] NEXT_PUBLIC_SYNC_API_URL non configurato.');
  }
  return normalizeURL(envUrl);
};

/** Configurazione Meilisearch per il catalogo carte (server-only). */
const getMeilisearchHost = (): string => {
  const url =
    process.env.MEILISEARCH_URL ||
    process.env.NEXT_PUBLIC_MEILISEARCH_URL ||
    process.env.MEILI_URL ||
    '';
  if (!url && isDevelopment) {
    console.warn('[Config] MEILISEARCH_URL non configurato.');
  }
  return normalizeURL(url);
};

const getMeilisearchApiKey = (): string => {
  return (
    process.env.MEILISEARCH_API_KEY ||
    process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY ||
    process.env.MEILI_API_KEY ||
    ''
  );
};

const getMeilisearchIndex = (): string => {
  return (
    process.env.MEILISEARCH_INDEX ||
    process.env.NEXT_PUBLIC_MEILISEARCH_INDEX ||
    'cards'
  );
};

export const ASSETS = {
  cdnUrl: cdnBase,
  imagesBaseUrl: cdnBase ? `${cdnBase}/images` : '',
} as const;

/** URL immagine UI condivisa (logo, icone) dal CDN Ebartex. */
export function getCdnImageUrl(path: string): string {
  const p = path.replace(/^\/+/, '');
  if (ASSETS.imagesBaseUrl) return `${ASSETS.imagesBaseUrl}/${p}`;
  return `/images/${p}`;
}

export const config = {
  api: {
    baseURL: getAuthApiURL(),
    syncBaseURL: getSyncApiURL(),
    timeout: 30000,
  },
  meilisearch: {
    host: getMeilisearchHost(),
    apiKey: getMeilisearchApiKey(),
    indexName: getMeilisearchIndex(),
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
