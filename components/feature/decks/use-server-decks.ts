'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { createDeckAction, deleteDeckAction, updateDeckAction } from '@/actions/decks';
import {
  addCardToDeck,
  moveCardInDeck,
  removeCardFromDeck,
  updateCardQtyInDeck,
} from '@/lib/data/deck-mutations';
import type { Deck } from '@/types/deck';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { CardCatalogHit } from '@/types/card';

function isTempDeckId(deckId: string): boolean {
  return deckId.startsWith('temp-');
}

/** Debounce del salvataggio: modifiche ravvicinate (es. +1 +1) diventano un solo update. */
const PERSIST_DEBOUNCE_MS = 600;

interface UseServerDecksOptions {
  /** Quando il server assegna l'id definitivo al posto del temp ottimistico. */
  onDeckIdRemap?: (fromId: string, toId: string) => void;
  onError?: (error: string) => void;
}

export function useServerDecks(initialDecks: Deck[], options: UseServerDecksOptions = {}) {
  const { onDeckIdRemap, onError } = options;
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [dirtyDeckIds, setDirtyDeckIds] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const clearError = useCallback(() => setError(null), []);

  const decksRef = useRef(decks);
  useEffect(() => {
    decksRef.current = decks;
  }, [decks]);

  const markDirty = useCallback((deckId: string) => {
    setDirtyDeckIds((prev) => (prev.has(deckId) ? prev : new Set(prev).add(deckId)));
  }, []);

  useEffect(() => {
    const ready = [...dirtyDeckIds].filter((id) => !isTempDeckId(id));
    if (ready.length === 0) return;

    const timer = window.setTimeout(() => {
      setDirtyDeckIds((prev) => {
        const next = new Set(prev);
        for (const id of ready) next.delete(id);
        return next;
      });
      startTransition(async () => {
        for (const id of ready) {
          const deck = decksRef.current.find((d) => d.id === id);
          if (deck && !isTempDeckId(deck.id)) {
            await updateDeckAction({ deckId: deck.id, main: deck.main, side: deck.side });
          }
        }
      });
    }, PERSIST_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [dirtyDeckIds, decks]);

  const dirtyRef = useRef(dirtyDeckIds);
  useEffect(() => {
    dirtyRef.current = dirtyDeckIds;
  }, [dirtyDeckIds]);

  useEffect(() => {
    return () => {
      for (const id of dirtyRef.current) {
        const deck = decksRef.current.find((d) => d.id === id);
        if (deck && !isTempDeckId(deck.id)) {
          void updateDeckAction({ deckId: deck.id, main: deck.main, side: deck.side });
        }
      }
    };
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
          setDecks((prev) =>
            prev.map((d) =>
              d.id === tempId
                ? { ...res.deck, main: d.main, side: d.side, verificationStatus: d.verificationStatus }
                : d
            )
          );
          setDirtyDeckIds((prev) => {
            if (!prev.has(tempId)) return prev;
            const next = new Set(prev);
            next.delete(tempId);
            next.add(res.deck.id);
            return next;
          });
          onDeckIdRemap?.(tempId, res.deck.id);
        } else {
          setError(res.error);
          onError?.(res.error);
          setDecks((prev) => prev.filter((d) => d.id !== tempId));
          setDirtyDeckIds((prev) => {
            if (!prev.has(tempId)) return prev;
            const next = new Set(prev);
            next.delete(tempId);
            return next;
          });
        }
      });

      return optimistic;
    },
    [onDeckIdRemap, onError]
  );

  const deleteDeck = useCallback((deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    setDirtyDeckIds((prev) => {
      if (!prev.has(deckId)) return prev;
      const next = new Set(prev);
      next.delete(deckId);
      return next;
    });
    if (isTempDeckId(deckId)) return;
    startTransition(async () => {
      await deleteDeckAction(deckId);
    });
  }, []);

  const patchDeck = useCallback(
    (deckId: string, updater: (deck: Deck) => Deck) => {
      setDecks((prev) => prev.map((d) => (d.id === deckId ? updater(d) : d)));
      markDirty(deckId);
    },
    [markDirty]
  );

  const addCard = useCallback(
    (deckId: string, catalogCard: CardCatalogHit, section: 'main' | 'side') => {
      patchDeck(deckId, (deck) => addCardToDeck(deck, catalogCard, section));
      return { success: true as const };
    },
    [patchDeck]
  );

  const removeCard = useCallback(
    (deckId: string, blueprintId: number, section: 'main' | 'side') => {
      patchDeck(deckId, (deck) => removeCardFromDeck(deck, blueprintId, section));
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
      patchDeck(deckId, (deck) =>
        updateCardQtyInDeck(deck, blueprintId, section, quantity, maxQuantity)
      );
    },
    [patchDeck]
  );

  const moveCard = useCallback(
    (deckId: string, blueprintId: number, from: 'main' | 'side', to: 'main' | 'side') => {
      patchDeck(deckId, (deck) => moveCardInDeck(deck, blueprintId, from, to));
    },
    [patchDeck]
  );

  const getDeck = useCallback((deckId: string) => decks.find((d) => d.id === deckId), [decks]);
  const setDeckState = useCallback((next: Deck[]) => setDecks(next), []);

  return {
    decks,
    error,
    clearError,
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
