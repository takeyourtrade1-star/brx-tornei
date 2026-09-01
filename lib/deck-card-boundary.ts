import 'server-only';

import { getCardsByBlueprintIds } from '@/lib/data/catalog-cards';
import type { Deck, DeckCard } from '@/types/deck';

export interface UntrustedDeckCardInput {
  id: string;
  quantity: number;
  isCommander?: boolean;
}

export class DeckCardResolutionError extends Error {}

function blueprintId(card: UntrustedDeckCardInput): number {
  const value = Number(card.id);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new DeckCardResolutionError('Il mazzo contiene una carta non valida.');
  }
  return value;
}

/** Ricostruisce ogni carta da dati catalogo server-side, senza fidarsi del browser. */
export async function resolveTrustedDeckCards(
  cards: UntrustedDeckCardInput[],
): Promise<DeckCard[]> {
  const ids = cards.map(blueprintId);
  const catalog = await getCardsByBlueprintIds(ids);

  return cards.map((input, index) => {
    const id = ids[index]!;
    const trusted = catalog[id];
    if (!trusted) {
      throw new DeckCardResolutionError(
        'Una carta del mazzo non è più disponibile nel catalogo. Rimuovila e riprova.',
      );
    }
    return {
      id: String(id),
      name: trusted.name,
      image: trusted.image,
      setName: trusted.setName,
      setCode: trusted.setCode,
      rarity: trusted.rarity,
      collectorNumber: trusted.collectorNumber,
      oracleId: trusted.oracleId,
      scryfallId: trusted.scryfallId,
      quantity: input.quantity,
      ...(input.isCommander === true ? { isCommander: true } : {}),
    };
  });
}

/** Rimuove anche metadati eventualmente persistiti in precedenza dal client. */
export async function resolveTrustedDeck(deck: Deck): Promise<Deck> {
  const [main, side] = await Promise.all([
    resolveTrustedDeckCards(deck.main),
    resolveTrustedDeckCards(deck.side),
  ]);
  return { ...deck, main, side };
}
