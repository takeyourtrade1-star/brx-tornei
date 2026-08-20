import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';

describe('Meilisearch server credentials', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('never accepts a browser-exposed API key as a server credential', () => {
    vi.stubEnv('MEILISEARCH_SEARCH_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_MEILISEARCH_API_KEY', 'public-secret');
    vi.stubEnv('VITE_MEILISEARCH_API_KEY', 'vite-secret');

    expect(getMeilisearchServerConfig().apiKey).toBe('');
  });

  it('accepts the preferred server-side search-scoped key', () => {
    vi.stubEnv('MEILISEARCH_SEARCH_KEY', 'search-only-secret');
    expect(getMeilisearchServerConfig().apiKey).toBe('search-only-secret');
  });

  it.each(['MEILISEARCH_SEARCH_API_KEY', 'MEILISEARCH_API_KEY'])(
    'keeps the server-only deployment alias %s compatible',
    (name) => {
      vi.stubEnv('MEILISEARCH_SEARCH_KEY', '');
      vi.stubEnv(name, 'legacy-server-secret');
      expect(getMeilisearchServerConfig().apiKey).toBe('legacy-server-secret');
    },
  );

  it('uses the fixed cards index by default and rejects non-canonical UIDs', () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const name of ('MEILISEARCH_INDEX,MEILISEARCH_INDEX_NAME,MEILI_INDEX').split(',')) {
      vi.stubEnv(name, '');
    }
    expect(getMeilisearchServerConfig().index).toBe('cards');
    for (const invalid of ('../cards,/cards,cards/other, cards,cards?x').split(',')) {
      vi.stubEnv('MEILISEARCH_INDEX', invalid);
      expect(getMeilisearchServerConfig().index).toBe('');
    }
    vi.stubEnv('MEILISEARCH_INDEX', 'cards-prod_2026');
    expect(getMeilisearchServerConfig().index).toBe('cards-prod_2026');
  });

  it('requires an exact allowlisted HTTPS Meilisearch origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', 'search.ebartex.com');
    vi.stubEnv('MEILISEARCH_URL', 'https://search.ebartex.com');
    expect(getMeilisearchServerConfig().url).toBe('https://search.ebartex.com');
    for (const invalid of (
      'http://search.ebartex.com,https://user@search.ebartex.com,https://search.ebartex.com.evil.test,https://search.ebartex.com/path'
    ).split(',')) {
      vi.stubEnv('MEILISEARCH_URL', invalid);
      expect(getMeilisearchServerConfig().url).toBe('');
    }
  });

  it('uses the canonical production search origin when the deploy omits it', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MEILISEARCH_URL', '');
    vi.stubEnv('MEILI_URL', '');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', 'api.ebartex.com');

    expect(getMeilisearchServerConfig().url).toBe('https://search.ebartex.com');
  });
});
