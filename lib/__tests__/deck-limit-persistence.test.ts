import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  MAX_DECKS_PER_USER,
  createDeck,
  deleteDeck,
  getDeckById,
  listDecks,
  saveDeckCards,
} from '@/lib/data/decks';
import { validateDeckLegality } from '@/lib/deck-legality';
import { card } from './test-helpers';

describe('Deck Persistence & Limit (Max 3)', () => {
  const userId = 'user-test-limit-1';

  beforeEach(async () => {
    const existing = await listDecks(userId);
    for (const d of existing) {
      await deleteDeck(userId, d.id);
    }
  });

  it('permette di creare fino a 3 mazzi per utente', async () => {
    const d1 = await createDeck(userId, {
      name: 'Mono Red',
      formatId: 'modern',
      archetypeId: 'burn',
    });
    const d2 = await createDeck(userId, {
      name: 'Azorius Control',
      formatId: 'standard',
      archetypeId: 'control',
    });
    const d3 = await createDeck(userId, {
      name: 'Golgari Midrange',
      formatId: 'pioneer',
      archetypeId: 'midrange',
    });

    const userDecks = await listDecks(userId);
    expect(userDecks).toHaveLength(3);
    expect(userDecks.map((d) => d.name)).toContain('Mono Red');
    expect(userDecks.map((d) => d.name)).toContain('Azorius Control');
    expect(userDecks.map((d) => d.name)).toContain('Golgari Midrange');
  });

  it('blocca la creazione del 4° mazzo con errore', async () => {
    await createDeck(userId, { name: 'Mazzo 1', formatId: 'modern', archetypeId: 'aggro' });
    await createDeck(userId, { name: 'Mazzo 2', formatId: 'modern', archetypeId: 'combo' });
    await createDeck(userId, { name: 'Mazzo 3', formatId: 'modern', archetypeId: 'control' });

    await expect(
      createDeck(userId, { name: 'Mazzo 4', formatId: 'modern', archetypeId: 'tempo' })
    ).rejects.toThrow(`Hai raggiunto il limite massimo di ${MAX_DECKS_PER_USER} mazzi.`);
  });

  it('dopo l’eliminazione di un mazzo permette di crearne un altro', async () => {
    const d1 = await createDeck(userId, { name: 'Mazzo 1', formatId: 'modern', archetypeId: 'aggro' });
    await createDeck(userId, { name: 'Mazzo 2', formatId: 'modern', archetypeId: 'combo' });
    await createDeck(userId, { name: 'Mazzo 3', formatId: 'modern', archetypeId: 'control' });

    await deleteDeck(userId, d1.id);
    const afterDelete = await listDecks(userId);
    expect(afterDelete).toHaveLength(2);

    const d4 = await createDeck(userId, { name: 'Mazzo 4', formatId: 'modern', archetypeId: 'ramp' });
    const finalDecks = await listDecks(userId);
    expect(finalDecks).toHaveLength(3);
    expect(finalDecks.some((d) => d.id === d4.id)).toBe(true);
  });

  it('salva e recupera le carte del mazzo (main e side)', async () => {
    const deck = await createDeck(userId, {
      name: 'Modern Bolt',
      formatId: 'modern',
      archetypeId: 'burn',
    });

    const mainCards = [
      card('Lightning Bolt', 4, { oracleId: 'bolt' }),
      card('Mountain', 56, { oracleId: 'mountain' }),
    ];
    const sideCards = [card('Smash to Smithereens', 4, { oracleId: 'smash' })];

    await saveDeckCards(userId, deck.id, mainCards, sideCards);

    const updated = await getDeckById(userId, deck.id);
    expect(updated).not.toBeNull();
    expect(updated!.main).toHaveLength(2);
    expect(updated!.side).toHaveLength(1);
    expect(updated!.verificationStatus).toBe('declared');
  });

  it('valida la legalità del mazzo con Scryfall (bannate e restrizioni)', async () => {
    const deck = await createDeck(userId, {
      name: 'Commander Test',
      formatId: 'commander',
      archetypeId: 'control',
    });

    const illegalMain = [
      card('Sol Ring', 2, { oracleId: 'sol-ring' }),
      card('Island', 98, { oracleId: 'island' }),
    ];
    const validation = validateDeckLegality({ ...deck, main: illegalMain });
    expect(validation.legal).toBe(false);
    expect(validation.issues.some((i) => i.message.includes('Commander: max 1'))).toBe(true);
  });
});
