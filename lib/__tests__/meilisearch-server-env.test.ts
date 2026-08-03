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

  it('accepts only the server-side search-scoped key', () => {
    vi.stubEnv('MEILISEARCH_SEARCH_KEY', 'search-only-secret');
    expect(getMeilisearchServerConfig().apiKey).toBe('search-only-secret');
  });

  it('fails closed on missing or non-canonical production index UIDs', () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const name of ('MEILISEARCH_INDEX,MEILISEARCH_INDEX_NAME,MEILI_INDEX').split(',')) {
      vi.stubEnv(name, '');
    }
    expect(getMeilisearchServerConfig().index).toBe('');
    for (const invalid of ('../cards,/cards,cards/other, cards,cards?x,').split(',')) {
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
});
