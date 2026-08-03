import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCardsByBlueprintIds: vi.fn(),
  getMyInventory: vi.fn(),
  resolveScanAndAddToInventory: vi.fn(),
  enforceServerRateLimit: vi.fn(),
  getDeckById: vi.fn(),
  validateDeckLegalityWithScryfall: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/data/catalog-cards', () => ({
  getCardsByBlueprintIds: mocks.getCardsByBlueprintIds,
}));
vi.mock('@/lib/data/inventory', () => ({ getMyInventory: mocks.getMyInventory }));
vi.mock('@/lib/data/resolve-scan', () => ({
  resolveScanAndAddToInventory: mocks.resolveScanAndAddToInventory,
}));
vi.mock('@/lib/data/decks', () => ({ getDeckById: mocks.getDeckById }));
vi.mock('@/lib/deck-legality-with-scryfall', () => ({
  validateDeckLegalityWithScryfall: mocks.validateDeckLegalityWithScryfall,
}));
vi.mock('@/lib/security/server-rate-limit', () => ({
  enforceServerRateLimit: mocks.enforceServerRateLimit,
  statusForServerRateLimitError: () => 503,
}));
vi.mock('@/lib/config', () => ({
  config: {
    app: { siteUrl: 'https://tornei.ebartex.com' },
    features: { ephemeralInventoryMutations: true },
  },
}));

import { POST as cardsByBlueprints } from '../../app/api/cards-by-blueprints/route';
import { POST as resolveScan } from '../../app/api/cards/resolve-scan/route';
import { POST as validateDeckLegality } from '../../app/api/decks/validate-legality/route';

const handlers = [
  ['cards-by-blueprints', cardsByBlueprints],
  ['resolve-scan', resolveScan],
  ['validate-legality', validateDeckLegality],
] as const;

describe('card POST origin and media-type gates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it.each(handlers)('%s rejects cross-site before auth/body/upstream', async (_name, handler) => {
    const response = await handler(new Request('https://tornei.ebartex.com/api/cards', {
      method: 'POST',
      headers: {
        Origin: 'https://attacker.example',
        'Sec-Fetch-Site': 'cross-site',
        'Content-Type': 'application/json',
      },
      body: '{}',
    }) as never);
    expect(response.status).toBe(403);
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.enforceServerRateLimit).not.toHaveBeenCalled();
    expect(mocks.getCardsByBlueprintIds).not.toHaveBeenCalled();
    expect(mocks.getMyInventory).not.toHaveBeenCalled();
    expect(mocks.resolveScanAndAddToInventory).not.toHaveBeenCalled();
    expect(mocks.getDeckById).not.toHaveBeenCalled();
    expect(mocks.validateDeckLegalityWithScryfall).not.toHaveBeenCalled();
  });

  it.each(handlers)('%s rejects text/plain before auth/body/upstream', async (_name, handler) => {
    const response = await handler(new Request('https://tornei.ebartex.com/api/cards', {
      method: 'POST',
      headers: {
        Origin: 'https://tornei.ebartex.com',
        'Sec-Fetch-Site': 'same-origin',
        'Content-Type': 'text/plain',
      },
      body: '{}',
    }) as never);
    expect(response.status).toBe(415);
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.enforceServerRateLimit).not.toHaveBeenCalled();
    expect(mocks.getCardsByBlueprintIds).not.toHaveBeenCalled();
    expect(mocks.getMyInventory).not.toHaveBeenCalled();
    expect(mocks.resolveScanAndAddToInventory).not.toHaveBeenCalled();
    expect(mocks.getDeckById).not.toHaveBeenCalled();
    expect(mocks.validateDeckLegalityWithScryfall).not.toHaveBeenCalled();
  });
});
