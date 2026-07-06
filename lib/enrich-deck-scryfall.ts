import 'server-only';
import {
  applyScryfallToDeckCard,
  enrichCardFromScryfall,
  fetchScryfallCollection,
  type ScryfallCollectionIdentifier,
} from '@/lib/data/scryfall';
import type { Deck, DeckCard } from '@/types/deck';

function blueprintKey(card: DeckCard): string {
  return String(card.id);
}

function needsEnrichment(card: DeckCard): boolean {
  return !card.tournamentLegalities;
}

function applyEnriched(
  cards: DeckCard[],
  enrichedByBlueprint: Map<string, DeckCard>
): DeckCard[] {
  return cards.map((card) => enrichedByBlueprint.get(blueprintKey(card)) ?? card);
}

function collectionKeyFromResponse(card: {
  id?: string;
  set?: string;
  collector_number?: string;
}): string | null {
  if (card.id) return `id:${card.id}`;
  if (card.set && card.collector_number) {
    return `set:${card.set.toLowerCase()}:${card.collector_number}`;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Arricchisce le carte del mazzo con legalità Scryfall (batch collection + fallback nome/set).
 * Le carte che hanno già tournamentLegalities non vengono re-fetchate.
 */
export async function enrichDeckFromScryfall(deck: Deck): Promise<Deck> {
  const unique = new Map<string, DeckCard>();
  for (const card of [...deck.main, ...deck.side]) {
    unique.set(blueprintKey(card), card);
  }

  const pending = [...unique.values()].filter(needsEnrichment);
  if (pending.length === 0) return deck;

  const enrichedByBlueprint = new Map<string, DeckCard>();
  for (const card of unique.values()) {
    if (!needsEnrichment(card)) {
      enrichedByBlueprint.set(blueprintKey(card), card);
    }
  }

  const identifiers: ScryfallCollectionIdentifier[] = [];
  const idCards: DeckCard[] = [];
  const setNumCards: DeckCard[] = [];
  const fallbackCards: DeckCard[] = [];

  for (const card of pending) {
    if (card.scryfallId) {
      identifiers.push({ id: card.scryfallId });
      idCards.push(card);
    } else if (card.setCode && card.collectorNumber) {
      identifiers.push({
        set: card.setCode.trim().toLowerCase(),
        collector_number: card.collectorNumber.trim(),
      });
      setNumCards.push(card);
    } else {
      fallbackCards.push(card);
    }
  }

  const scryfallCards = await fetchScryfallCollection(identifiers);
  const scryfallByKey = new Map<string, (typeof scryfallCards)[number]>();
  for (const sf of scryfallCards) {
    const key = collectionKeyFromResponse(sf);
    if (key) scryfallByKey.set(key, sf);
  }

  for (const card of idCards) {
    const sf = card.scryfallId ? scryfallByKey.get(`id:${card.scryfallId}`) : undefined;
    if (sf) {
      enrichedByBlueprint.set(blueprintKey(card), applyScryfallToDeckCard(card, sf));
    } else {
      fallbackCards.push(card);
    }
  }

  for (const card of setNumCards) {
    if (enrichedByBlueprint.has(blueprintKey(card))) continue;
    const set = card.setCode!.trim().toLowerCase();
    const num = card.collectorNumber!.trim();
    const sf = scryfallByKey.get(`set:${set}:${num}`);
    if (sf) {
      enrichedByBlueprint.set(blueprintKey(card), applyScryfallToDeckCard(card, sf));
    } else {
      fallbackCards.push(card);
    }
  }

  for (const card of fallbackCards) {
    if (enrichedByBlueprint.has(blueprintKey(card))) continue;
    await sleep(100);
    const enrichment = await enrichCardFromScryfall({
      cardName: card.name,
      setCode: card.setCode,
      collectorNumber: card.collectorNumber,
      scryfallId: card.scryfallId,
    });
    if (enrichment) {
      enrichedByBlueprint.set(blueprintKey(card), {
        ...card,
        scryfallId: card.scryfallId ?? enrichment.scryfallId,
        oracleId: card.oracleId ?? enrichment.oracleId,
        rarity: card.rarity ?? enrichment.rarity,
        collectorNumber: card.collectorNumber ?? enrichment.collectorNumber,
        image: card.image ?? enrichment.image ?? card.image,
        tournamentLegalities: enrichment.tournamentLegalities,
      });
    } else {
      enrichedByBlueprint.set(blueprintKey(card), card);
    }
  }

  return {
    ...deck,
    main: applyEnriched(deck.main, enrichedByBlueprint),
    side: applyEnriched(deck.side, enrichedByBlueprint),
  };
}
