/**
 * Application Configuration — Ebartex Tournaments
 * Stesso pattern di new_frontend_brx/lib/config.ts.
 */

import 'server-only';

import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import { publicConfig } from '@/lib/public-config';

const isDevelopment = process.env.NODE_ENV === 'development';

const normalizeURL = (url: string): string => url.replace(/\/+$/, '');
const DNS_HOSTNAME =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function isIPv4Literal(hostname: string): boolean {
  const octets = hostname.split('.');
  return (
    octets.length === 4 &&
    octets.every(
      (octet) =>
        /^(?:0|[1-9]\d{0,2})$/.test(octet) && Number(octet) <= 255,
    )
  );
}

function isIPLiteral(hostname: string): boolean {
  return isIPv4Literal(hostname) || hostname.includes(':') || hostname.includes('[');
}

const DEFAULT_TRUSTED_HOSTS = new Set([
  'api.ebartex.com',
  'sync.ebartex.com',
  'api-tornei.ebartex.com',
]);

function trustedUpstreamHosts(): ReadonlySet<string> {
  const hosts = new Set<string>(DEFAULT_TRUSTED_HOSTS);
  const raw = process.env.TRUSTED_UPSTREAM_HOSTS;
  if (raw?.trim()) {
    const values = raw.split(',').map((value) => value.trim());
    for (const host of values) {
      if (
        host === host.toLowerCase() &&
        !isIPLiteral(host) &&
        DNS_HOSTNAME.test(host)
      ) {
        hosts.add(host);
      }
    }
  }
  return hosts;
}

function isLoopback(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === 'localhost' || normalized === '::1' || normalized === '[::1]') {
    return true;
  }
  return isIPv4Literal(normalized) && normalized.startsWith('127.');
}

/** Runtime fail-closed boundary for every server-side service origin. */
export function trustedUpstreamOrigin(raw: string | undefined): string {
  if (!raw || raw !== raw.trim() || raw.length > 2_048) return '';
  try {
    const url = new URL(raw);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname !== '/' && url.pathname !== '') ||
      (raw !== url.origin && raw !== `${url.origin}/`)
    ) {
      return '';
    }
    if (process.env.NODE_ENV === 'production') {
      const hosts = trustedUpstreamHosts();
      if (
        url.protocol !== 'https:' ||
        url.port ||
        !hosts.has(url.hostname.toLowerCase())
      ) {
        return '';
      }
    } else if (
      url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && isLoopback(url.hostname))
    ) {
      return '';
    }
    return url.origin;
  } catch {
    return '';
  }
}

/**
 * URL del microservizio di autenticazione (FastAPI su AWS) — lo stesso del sito principale.
 *
 * NB: niente throw a livello di modulo. Durante `next build` Next importa le route
 * per la raccolta dati (NODE_ENV=production) e un throw qui rompe la build anche
 * quando la variabile sarà presente a runtime. I consumer gestiscono già il caso
 * baseURL vuoto (proxy → 503, bridge → redirect /login, action → errore tipizzato).
 */
const getAuthApiURL = (): string => {
  const envUrl = process.env.AUTH_API_URL || 'https://api.ebartex.com';
  return trustedUpstreamOrigin(envUrl);
};

/** URL del microservizio Sync (BRX Sync) — usato per l'inventario utente. */
const getSyncApiURL = (): string => {
  const envUrl = process.env.SYNC_API_URL || 'https://sync.ebartex.com';
  return trustedUpstreamOrigin(envUrl);
};

/** URL del Tournament Service — CRUD tornei, join, signaling. */
const getTournamentsApiURL = (): string => {
  const envUrl = process.env.TOURNAMENTS_API_URL || 'https://api-tornei.ebartex.com';
  return trustedUpstreamOrigin(envUrl);
};

/** WebSocket origin esplicito in produzione, derivato dall'API solo in locale. */
const getTournamentsWebSocketOrigin = (): string => {
  const configured = publicConfig.websocket.tournamentsOrigin;
  if (configured) return normalizeURL(configured);

  const apiBase = isDevelopment ? getTournamentsApiURL() : '';
  if (!apiBase) return '';
  try {
    const url = new URL(apiBase);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.origin;
  } catch {
    return '';
  }
};

/** Configurazione Meilisearch — stesse env di new_frontend_brx (server-only). */
function getMeilisearchConfig() {
  const { url, apiKey, index } = getMeilisearchServerConfig();
  if (!url && isDevelopment) {
    console.warn('[Config] MEILISEARCH_URL non configurato.');
  }
  return {
    host: normalizeURL(url),
    apiKey,
    indexName: index,
  };
}

export const config = {
  api: {
    baseURL: getAuthApiURL(),
    syncBaseURL: getSyncApiURL(),
    tournamentsBaseURL: getTournamentsApiURL(),
    tournamentsWebSocketOrigin: getTournamentsWebSocketOrigin(),
    timeout: 30000,
  },
  meilisearch: getMeilisearchConfig(),
  auth: {
    /** Host-only cookies: never writable by or shared with sibling subdomains. */
    accessCookie: '__Host-ebartex_access_token',
    refreshCookie: '__Host-ebartex_refresh_token',
    preAuthCookie: '__Host-ebartex_pre_auth_token',
    // Fallback conservativo durante rollout: il cookie deve sparire prima di un
    // JWT di durata ignota, così il middleware può attivare il refresh bridge.
    accessMaxAge: 5 * 60,
    refreshMaxAge: 60 * 60 * 24 * 30, // 30 giorni
  },
  app: publicConfig.app,
  storage: publicConfig.storage,
  debug: {
    isDevelopment,
  },
  features: {
    matchGapRecording: publicConfig.features.matchGapRecording,
    // Deck/inventory writes do not exist yet. Their ephemeral stores are
    // development-only and must not masquerade as production persistence.
    ephemeralDeckMutations:
      isDevelopment && process.env.ENABLE_EPHEMERAL_DECK_MUTATIONS === 'true',
    ephemeralInventoryMutations:
      isDevelopment && process.env.ENABLE_EPHEMERAL_INVENTORY_MUTATIONS === 'true',
    // Il social deve usare PostgreSQL in produzione: il mock e lo store su
    // disco sono ammessi solo per sviluppo locale esplicitamente opt-in.
    ephemeralSocial:
      isDevelopment && process.env.ENABLE_EPHEMERAL_SOCIAL === 'true',
  },
} as const;
