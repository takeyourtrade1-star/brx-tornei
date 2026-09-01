import 'server-only';
import {
  applyScryfallToDeckCard,
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

function collectionKeysFromResponse(card: {
  id?: string;
  name?: string;
  set?: string;
  collector_number?: string;
}): string[] {
  const keys: string[] = [];
  if (card.id) keys.push(`id:${card.id}`);
  if (card.set && card.collector_number) {
    keys.push(`set:${card.set.toLowerCase()}:${card.collector_number}`);
  }
  if (card.name) keys.push(`name:${card.name.trim().toLowerCase()}`);
  return keys;
}

function primaryLookup(card: DeckCard): {
  identifier: ScryfallCollectionIdentifier;
  key: string;
} {
  if (card.scryfallId) {
    return { identifier: { id: card.scryfallId }, key: `id:${card.scryfallId}` };
  }
  if (card.setCode && card.collectorNumber) {
    const set = card.setCode.trim().toLowerCase();
    const collectorNumber = card.collectorNumber.trim();
    return {
      identifier: { set, collector_number: collectorNumber },
      key: `set:${set}:${collectorNumber}`,
    };
  }
  const name = card.name.trim();
  return { identifier: { name }, key: `name:${name.toLowerCase()}` };
}

function indexResponses<T extends {
  id?: string;
  name?: string;
  set?: string;
  collector_number?: string;
}>(cards: T[]): Map<string, T> {
  const byKey = new Map<string, T>();
  for (const card of cards) {
    for (const key of collectionKeysFromResponse(card)) byKey.set(key, card);
  }
  return byKey;
}

/**
 * Arricchisce le carte del mazzo con sole query batch e un deadline comune.
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

  const deadline = AbortSignal.timeout(12_000);
  const plans = pending.map((card) => ({ card, ...primaryLookup(card) }));
  const primaryResponses = await fetchScryfallCollection(
    plans.map((plan) => plan.identifier),
    { signal: deadline },
  );
  const primaryByKey = indexResponses(primaryResponses);
  const unresolved: DeckCard[] = [];

  for (const plan of plans) {
    const response = primaryByKey.get(plan.key);
    if (response) {
      enrichedByBlueprint.set(
        blueprintKey(plan.card),
        applyScryfallToDeckCard(plan.card, response),
      );
    } else {
      unresolved.push(plan.card);
    }
  }

  if (unresolved.length > 0 && !deadline.aborted) {
    const fallbackResponses = await fetchScryfallCollection(
      unresolved.map((card) => ({ name: card.name.trim() })),
      { signal: deadline },
    );
    const fallbackByKey = indexResponses(fallbackResponses);
    for (const card of unresolved) {
      const response = fallbackByKey.get(`name:${card.name.trim().toLowerCase()}`);
      enrichedByBlueprint.set(
        blueprintKey(card),
        response ? applyScryfallToDeckCard(card, response) : card,
      );
    }
  }

  return {
    ...deck,
    main: applyEnriched(deck.main, enrichedByBlueprint),
    side: applyEnriched(deck.side, enrichedByBlueprint),
  };
}
