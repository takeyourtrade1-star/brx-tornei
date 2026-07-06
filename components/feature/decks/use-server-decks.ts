'use client';

import { useCallback, useState, useTransition } from 'react';
import {
  createDeckAction,
  deleteDeckAction,
  updateDeckAction,
} from '@/actions/decks';
import type { Deck, DeckCard } from '@/types/deck';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { InventoryItem } from '@/types/inventory';

function findCardIndex(cards: DeckCard[], blueprintId: number): number {
  return cards.findIndex((c) => Number(c.id) === blueprintId);
}

function isTempDeckId(deckId: string): boolean {
  return deckId.startsWith('temp-');
}

interface UseServerDecksOptions {
  /** Quando il server assegna l'id definitivo al posto del temp ottimistico. */
  onDeckIdRemap?: (fromId: string, toId: string) => void;
}

export function useServerDecks(initialDecks: Deck[], options: UseServerDecksOptions = {}) {
  const { onDeckIdRemap } = options;
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [isPending, startTransition] = useTransition();

  const persistDeck = useCallback((deck: Deck) => {
    if (isTempDeckId(deck.id)) return;
    startTransition(async () => {
      await updateDeckAction({ deckId: deck.id, main: deck.main, side: deck.side });
    });
  }, []);

  const createDeck = useCallback(
    (input: CreateDeckInput): Deck => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: Deck = {
        id: tempId,
        name: input.name,
        formatId: input.formatId,
        archetypeId: input.archetypeId,
        main: [],
        side: [],
        createdAt: new Date().toISOString(),
        verificationStatus: 'none',
      };

      setDecks((prev) => [optimistic, ...prev]);

      startTransition(async () => {
        const res = await createDeckAction(input);
        if ('deck' in res) {
          setDecks((prev) => prev.map((d) => (d.id === tempId ? res.deck : d)));
          onDeckIdRemap?.(tempId, res.deck.id);
        } else {
          setDecks((prev) => prev.filter((d) => d.id !== tempId));
        }
      });

      return optimistic;
    },
    [onDeckIdRemap]
  );

  const deleteDeck = useCallback((deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    if (isTempDeckId(deckId)) return;
    startTransition(async () => {
      await deleteDeckAction(deckId);
    });
  }, []);

  const patchDeck = useCallback(
    (deckId: string, updater: (deck: Deck) => Deck) => {
      setDecks((prev) => {
        const next = prev.map((d) => (d.id === deckId ? updater(d) : d));
        const updated = next.find((d) => d.id === deckId);
        if (updated) persistDeck(updated);
        return next;
      });
    },
    [persistDeck]
  );

  const addCard = useCallback(
    (deckId: string, item: InventoryItem, section: 'main' | 'side') => {
      if (item.quantity <= 0) return { success: false as const, reason: 'Carta non disponibile' };
      patchDeck(deckId, (deck) => {
        const target = section === 'main' ? deck.main : deck.side;
        const idx = findCardIndex(target, item.blueprintId);
        const usedMain = deck.main.find((c) => Number(c.id) === item.blueprintId)?.quantity ?? 0;
        const usedSide = deck.side.find((c) => Number(c.id) === item.blueprintId)?.quantity ?? 0;
        if (usedMain + usedSide >= item.quantity) return deck;

        const card: DeckCard = { ...item.card, quantity: 1 };
        const next = { ...deck };
        if (idx >= 0) {
          const sectionCards = [...target];
          sectionCards[idx] = { ...sectionCards[idx], quantity: sectionCards[idx].quantity + 1 };
          next[section] = sectionCards;
        } else {
          next[section] = [...target, card];
        }
        return { ...next, verificationStatus: 'declared' as const };
      });
      return { success: true as const };
    },
    [patchDeck]
  );

  const removeCard = useCallback(
    (deckId: string, blueprintId: number, section: 'main' | 'side') => {
      patchDeck(deckId, (deck) => ({
        ...deck,
        [section]: deck[section].filter((c) => Number(c.id) !== blueprintId),
        verificationStatus: 'declared',
      }));
    },
    [patchDeck]
  );

  const updateQuantity = useCallback(
    (
      deckId: string,
      blueprintId: number,
      section: 'main' | 'side',
      quantity: number,
      maxQuantity: number
    ) => {
      const safeQty = Math.max(0, Math.min(quantity, maxQuantity));
      if (safeQty === 0) {
        removeCard(deckId, blueprintId, section);
        return;
      }
      patchDeck(deckId, (deck) => ({
        ...deck,
        [section]: deck[section].map((c) =>
          Number(c.id) === blueprintId ? { ...c, quantity: safeQty } : c
        ),
        verificationStatus: 'declared',
      }));
    },
    [patchDeck, removeCard]
  );

  const moveCard = useCallback(
    (deckId: string, blueprintId: number, from: 'main' | 'side', to: 'main' | 'side') => {
      if (from === to) return;
      patchDeck(deckId, (deck) => {
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
      });
    },
    [patchDeck]
  );

  const getDeck = useCallback((deckId: string) => decks.find((d) => d.id === deckId), [decks]);

  const setDeckState = useCallback((next: Deck[]) => setDecks(next), []);

  return {
    decks,
    isPending,
    createDeck,
    deleteDeck,
    addCard,
    removeCard,
    updateQuantity,
    moveCard,
    getDeck,
    setDeckState,
  };
}
