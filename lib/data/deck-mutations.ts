import type { CardCatalogHit } from '@/types/card';
import type { Deck, DeckCard } from '@/types/deck';
import { getRemainingCopies } from '@/lib/deck-copy-limits';
import { countCards, getMainDeckMinSize, getSideboardMaxSize } from './deck-utils';

export function findCardIndex(cards: DeckCard[], blueprintId: number): number {
  return cards.findIndex((c) => Number(c.id) === blueprintId);
}

export function addCardToDeck(
  deck: Deck,
  catalogCard: CardCatalogHit,
  section: 'main' | 'side',
  quantity = 1,
): Deck {
  const blueprintId = Number(catalogCard.id);
  if (!Number.isInteger(blueprintId) || blueprintId <= 0) return deck;

  const remainingCopies = getRemainingCopies(deck.formatId, catalogCard, deck.main, deck.side);
  if (remainingCopies <= 0) return deck;

  const maxSide = getSideboardMaxSize(deck.formatId);
  const sectionCapacity = section === 'main'
    ? getMainDeckMinSize(deck.formatId) - countCards(deck.main)
    : maxSide - countCards(deck.side);
  const requestedQuantity = Number.isFinite(quantity) ? Math.trunc(quantity) : 0;
  const addedQuantity = Math.max(0, Math.min(requestedQuantity, remainingCopies, sectionCapacity));
  if (addedQuantity === 0) return deck;

  const target = section === 'main' ? deck.main : deck.side;
  const idx = findCardIndex(target, blueprintId);
  const card: DeckCard = { ...catalogCard, quantity: addedQuantity };
  const next = { ...deck };

  if (idx >= 0) {
    const sectionCards = [...target];
    sectionCards[idx] = {
      ...sectionCards[idx],
      quantity: sectionCards[idx].quantity + addedQuantity,
    };
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
  const current = deck[section].find((card) => Number(card.id) === blueprintId);
  const sectionCapacity = section === 'main'
    ? getMainDeckMinSize(deck.formatId)
    : getSideboardMaxSize(deck.formatId);
  const quantityCapacity = Math.max(
    0,
    sectionCapacity - countCards(deck[section]) + (current?.quantity ?? 0),
  );
  const safeQty = Math.max(0, Math.min(quantity, maxQuantity, quantityCapacity));
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
  const targetCapacity = to === 'main'
    ? getMainDeckMinSize(deck.formatId)
    : getSideboardMaxSize(deck.formatId);
  if (targetCapacity === 0 || countCards(target) + card.quantity > targetCapacity) return deck;
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

/** Seleziona una singola carta del main come comandante. */
export function setCommanderInDeck(deck: Deck, blueprintId: number): Deck {
  if (deck.formatId !== 'commander') return deck;
  const target = deck.main.find((card) => Number(card.id) === blueprintId);
  if (!target || target.quantity !== 1) return deck;

  return {
    ...deck,
    main: deck.main.map((card) => {
      const { isCommander: _ignored, ...cleanCard } = card;
      return Number(card.id) === blueprintId
        ? { ...cleanCard, isCommander: true }
        : cleanCard;
    }),
    verificationStatus: 'declared',
  };
}
