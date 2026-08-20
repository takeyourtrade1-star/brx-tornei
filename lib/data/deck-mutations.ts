import type { CardCatalogHit } from '@/types/card';
import type { Deck, DeckCard } from '@/types/deck';
import { getRemainingCopies } from '@/lib/deck-copy-limits';
import { countCards, getSideboardMaxSize } from './deck-utils';

export function findCardIndex(cards: DeckCard[], blueprintId: number): number {
  return cards.findIndex((c) => Number(c.id) === blueprintId);
}

export function addCardToDeck(
  deck: Deck,
  catalogCard: CardCatalogHit,
  section: 'main' | 'side'
): Deck {
  const blueprintId = Number(catalogCard.id);
  if (!Number.isInteger(blueprintId) || blueprintId <= 0) return deck;

  const remaining = getRemainingCopies(deck.formatId, catalogCard, deck.main, deck.side);
  if (remaining <= 0) return deck;

  const maxSide = getSideboardMaxSize(deck.formatId);
  if (section === 'side' && maxSide > 0 && countCards(deck.side) >= maxSide) {
    return deck;
  }

  const target = section === 'main' ? deck.main : deck.side;
  const idx = findCardIndex(target, blueprintId);
  const card: DeckCard = { ...catalogCard, quantity: 1 };
  const next = { ...deck };

  if (idx >= 0) {
    const sectionCards = [...target];
    sectionCards[idx] = { ...sectionCards[idx], quantity: sectionCards[idx].quantity + 1 };
    next[section] = sectionCards;
  } else {
    next[section] = [...target, card];
  }

  return { ...next, verificationStatus: 'declared' as const };
}

export function removeCardFromDeck(
  deck: Deck,
  blueprintId: number,
  section: 'main' | 'side'
): Deck {
  return {
    ...deck,
    [section]: deck[section].filter((c) => Number(c.id) !== blueprintId),
    verificationStatus: 'declared',
  };
}

export function updateCardQtyInDeck(
  deck: Deck,
  blueprintId: number,
  section: 'main' | 'side',
  quantity: number,
  maxQuantity: number
): Deck {
  const safeQty = Math.max(0, Math.min(quantity, maxQuantity));
  if (safeQty === 0) {
    return removeCardFromDeck(deck, blueprintId, section);
  }
  return {
    ...deck,
    [section]: deck[section].map((c) =>
      Number(c.id) === blueprintId ? { ...c, quantity: safeQty } : c
    ),
    verificationStatus: 'declared',
  };
}

export function moveCardInDeck(
  deck: Deck,
  blueprintId: number,
  from: 'main' | 'side',
  to: 'main' | 'side'
): Deck {
  if (from === to) return deck;
  const source = deck[from];
  const target = deck[to];
  const idx = findCardIndex(source, blueprintId);
  if (idx < 0) return deck;
  const card = source[idx];
  const nextSource = source.filter((c) => Number(c.id) !== blueprintId);
  const targetIdx = findCardIndex(target, blueprintId);
  let nextTarget: DeckCard[];
  if (targetIdx >= 0) {
    nextTarget = target.map((c, i) =>
      i === targetIdx ? { ...c, quantity: c.quantity + card.quantity } : c
    );
  } else {
    nextTarget = [...target, card];
  }
  return { ...deck, [from]: nextSource, [to]: nextTarget, verificationStatus: 'declared' };
}
