import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  searchByName: vi.fn(),
  searchByScryfallId: vi.fn(),
  enrich: vi.fn(),
  addInventory: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/catalog-cards', () => ({
  searchCardByNameSet: mocks.searchByName,
  searchCardByScryfallId: mocks.searchByScryfallId,
}));
vi.mock('@/lib/data/scryfall-enrichment', () => ({
  enrichCardFromScryfall: mocks.enrich,
}));
vi.mock('@/lib/data/scanned-inventory-mock', () => ({
  addScannedCardToMockInventory: mocks.addInventory,
}));

import { resolveScanAndAddToInventory } from '@/lib/data/resolve-scan';

const attackerId = '11111111-1111-4111-8111-111111111111';
const trustedId = '22222222-2222-4222-8222-222222222222';
const trustedCatalogCard = {
  id: '123',
  name: 'Lightning Bolt',
  setCode: 'lea',
  collectorNumber: '161',
  scryfallId: trustedId,
};

describe('confine identità Camera Match', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.addInventory.mockReturnValue({ blueprintId: 123, quantity: 1 });
  });

  it('rifiuta nome/set e ID Scryfall che identificano carte catalogo diverse', async () => {
    mocks.searchByName.mockResolvedValue(trustedCatalogCard);
    mocks.searchByScryfallId.mockResolvedValue({
      ...trustedCatalogCard,
      id: '456',
      name: 'Black Lotus',
      scryfallId: attackerId,
    });

    const result = await resolveScanAndAddToInventory('user-1', {
      cardName: 'Lightning Bolt',
      setCode: 'lea',
      scryfallId: attackerId,
    }, []);

    expect(result).toEqual({ ok: false, error: 'I dati dello scan identificano carte diverse.' });
    expect(mocks.enrich).not.toHaveBeenCalled();
    expect(mocks.addInventory).not.toHaveBeenCalled();
  });

  it('usa l’identità catalogo e ignora un ID caller non risolto', async () => {
    mocks.searchByName.mockResolvedValue(trustedCatalogCard);
    mocks.searchByScryfallId.mockResolvedValue(null);
    mocks.enrich.mockResolvedValue({
      name: 'Lightning Bolt',
      setCode: 'lea',
      scryfallId: trustedId,
      tournamentLegalities: { modern: 'legal' },
    });

    const result = await resolveScanAndAddToInventory('user-1', {
      cardName: 'Lightning Bolt',
      setCode: 'lea',
      collectorNumber: '161',
      scryfallId: attackerId,
      imageUri: 'https://attacker.example/forged.jpg',
    }, []);

    expect(mocks.enrich).toHaveBeenCalledWith({
      cardName: 'Lightning Bolt',
      setCode: 'lea',
      collectorNumber: '161',
      scryfallId: trustedId,
    });
    expect(result).toMatchObject({
      ok: true,
      data: {
        blueprintId: 123,
        card: { name: 'Lightning Bolt', scryfallId: trustedId },
      },
    });
    if (result.ok) expect(result.data.card.image).not.toBe('https://attacker.example/forged.jpg');
  });
});
