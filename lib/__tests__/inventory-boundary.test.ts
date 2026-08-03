import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  getMeilisearchServerConfig: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({
  config: { api: { syncBaseURL: 'https://sync.internal.test', timeout: 5_000 } },
}));
vi.mock('@/lib/auth/session', () => ({ getAccessToken: mocks.getAccessToken }));
vi.mock('@/lib/meilisearch-server-env', () => ({
  getMeilisearchServerConfig: mocks.getMeilisearchServerConfig,
}));

import {
  getUserInventory,
  InventoryBoundaryError,
} from '@/lib/data/inventory';
import { getCardsByBlueprintIds } from '@/lib/data/catalog-cards';

function inventoryItem(id: number) {
  return { id, blueprint_id: id + 1000, quantity: 1 };
}

describe('inventory upstream boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAccessToken.mockResolvedValue('access-token');
    mocks.getMeilisearchServerConfig.mockReturnValue({
      url: 'https://search.internal.test',
      apiKey: 'search-key',
      index: 'cards',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects an unbounded reported total after the first page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [inventoryItem(1)], total: 1_000_000 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getUserInventory('user-1')).rejects.toBeInstanceOf(
      InventoryBoundaryError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('detects a repeated page instead of accumulating it', async () => {
    const page = { items: [inventoryItem(1), inventoryItem(2)], total: 10 };
    const fetchMock = vi.fn().mockImplementation(
      () => Promise.resolve(new Response(JSON.stringify(page))),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getUserInventory('user-1')).rejects.toBeInstanceOf(
      InventoryBoundaryError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('deduplicates and chunks catalog filters to at most 200 IDs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ hits: [] })),
    );
    vi.stubGlobal('fetch', fetchMock);
    const ids = [...Array.from({ length: 450 }, (_, index) => index + 1), 1, 2, 3];

    await getCardsByBlueprintIds(ids);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [, init] of fetchMock.mock.calls) {
      const body = JSON.parse(String((init as RequestInit).body)) as {
        limit: number;
        filter: string;
      };
      expect(body.limit).toBeLessThanOrEqual(200);
      const values = body.filter.match(/\d+/g) ?? [];
      expect(values.length).toBe(body.limit);
    }
  });
});
