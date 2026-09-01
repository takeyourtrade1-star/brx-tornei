import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getCards: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/catalog-cards', () => ({
  getCardsByBlueprintIds: mocks.getCards,
}));

import { resolveTrustedDeckCards } from '@/lib/deck-card-boundary';
import { deckCardInputSchema } from '@/lib/validations/deck-actions';

describe('confine autorevole delle carte mazzo', () => {
  it('rimuove metadata browser e ricostruisce catalogo, oracle e stampa', async () => {
    mocks.getCards.mockResolvedValue({
      123: {
        id: 'catalog-internal-id',
        name: 'Lightning Bolt',
        image: 'https://trusted.example/bolt.jpg',
        setCode: 'lea',
        collectorNumber: '161',
        oracleId: 'trusted-oracle',
        scryfallId: 'trusted-print',
      },
    });
    const forged = {
      id: '123',
      quantity: 4,
      name: 'Basic Island',
      oracleId: 'attacker-oracle',
      scryfallId: 'attacker-print',
      tournamentLegalities: { modern: 'legal' },
    };

    expect(deckCardInputSchema.parse(forged)).toEqual({ id: '123', quantity: 4 });
    await expect(resolveTrustedDeckCards([forged])).resolves.toEqual([
      expect.objectContaining({
        id: '123',
        name: 'Lightning Bolt',
        oracleId: 'trusted-oracle',
        scryfallId: 'trusted-print',
        quantity: 4,
      }),
    ]);
  });

  it('fallisce chiuso se il blueprint non esiste nel catalogo', async () => {
    mocks.getCards.mockResolvedValue({});
    await expect(resolveTrustedDeckCards([{ id: '999', quantity: 1 }]))
      .rejects.toThrow('non è più disponibile');
  });
});
