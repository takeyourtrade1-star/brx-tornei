import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ enrich: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/enrich-deck-scryfall', () => ({
  enrichDeckFromScryfall: mocks.enrich,
}));

import { validateDeckLegalityWithScryfall } from '@/lib/deck-legality-with-scryfall';
import type { Deck } from '@/types/deck';

describe('preflight legalità mazzo', () => {
  it('rifiuta una struttura impossibile senza chiamare Scryfall', async () => {
    const deck: Deck = {
      id: 'snapshot',
      name: 'Amplificazione',
      formatId: 'modern',
      archetypeId: 'aggro',
      main: Array.from({ length: 250 }, (_, index) => ({
        id: String(index + 1),
        name: `Card ${index + 1}`,
        quantity: 1,
      })),
      side: [],
      createdAt: new Date(0).toISOString(),
      verificationStatus: 'none',
    };

    const result = await validateDeckLegalityWithScryfall(deck);
    expect(result.legal).toBe(false);
    expect(result.issues[0]?.message).toContain('esattamente 60');
    expect(mocks.enrich).not.toHaveBeenCalled();
  });
});
