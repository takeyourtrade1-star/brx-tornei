/**
 * Meilisearch config for Next.js server routes (API routes, RSC loaders).
 * Allineato a new_frontend_brx/lib/meilisearch-server-env.ts
 */

import 'server-only';

export type MeilisearchServerConfig = {
  url: string;
  apiKey: string;
  index: string;
};

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function trustedHosts(): Set<string> | null {
  const hosts = new Set(['search.ebartex.com']);
  const values = (process.env.TRUSTED_UPSTREAM_HOSTS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  for (const value of values) hosts.add(value);
  return hosts;
}

function canonicalMeilisearchOrigin(rawValue: string): string {
  const raw = trimTrailingSlashes(rawValue);
  if (!raw || raw !== raw.trim()) return '';
  try {
    const parsed = new URL(raw);
    if (
      parsed.username
      || parsed.password
      || parsed.pathname !== '/'
      || parsed.search
      || parsed.hash
      || (raw !== parsed.origin && raw !== `${parsed.origin}/`)
    ) return '';
    const host = parsed.hostname.toLowerCase();
    if (process.env.NODE_ENV === 'production') {
      if (
        parsed.protocol !== 'https:'
        || parsed.port
        || !trustedHosts()?.has(host)
      ) return '';
    } else if (
      parsed.protocol !== 'https:'
      && !(parsed.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1'))
    ) return '';
    return parsed.origin;
  } catch {
    return '';
  }
}

function canonicalIndexUid(rawValue: string | undefined): string {
  if (!rawValue) return 'cards';
  if (rawValue !== rawValue.trim()) return '';
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(rawValue) ? rawValue : '';
}

export function getMeilisearchServerConfig(): MeilisearchServerConfig {
  const url = canonicalMeilisearchOrigin(
    process.env.MEILISEARCH_URL ||
      process.env.MEILI_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://search.ebartex.com' : '') ||
      ''
  );

  // This must be a server-only, search-scoped key. Never fall back to a
  // NEXT_PUBLIC/VITE value: those variables are embedded in browser bundles.
  // MEILISEARCH_API_KEY resta un alias server-only per i deploy precedenti al
  // rename; la route espone comunque soltanto operazioni di ricerca limitate.
  const apiKey =
    process.env.MEILISEARCH_SEARCH_KEY ||
    process.env.MEILISEARCH_SEARCH_API_KEY ||
    process.env.MEILISEARCH_API_KEY ||
    '';

  const index = canonicalIndexUid(
    process.env.MEILISEARCH_INDEX ||
    process.env.MEILISEARCH_INDEX_NAME ||
    process.env.MEILI_INDEX
  );

  return { url, apiKey, index };
}
