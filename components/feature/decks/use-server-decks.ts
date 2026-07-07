'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  createDeckAction,
  deleteDeckAction,
  updateDeckAction,
} from '@/actions/decks';
import { getRemainingCopies } from '@/lib/deck-copy-limits';
import { getSideboardMaxSize, countCards } from '@/lib/data/deck-utils';
import type { Deck, DeckCard } from '@/types/deck';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { CardCatalogHit } from '@/types/card';

function findCardIndex(cards: DeckCard[], blueprintId: number): number {
  return cards.findIndex((c) => Number(c.id) === blueprintId);
}

function isTempDeckId(deckId: string): boolean {
  return deckId.startsWith('temp-');
}

/** Debounce del salvataggio: modifiche ravvicinate (es. +1 +1) diventano un solo update. */
const PERSIST_DEBOUNCE_MS = 600;

interface UseServerDecksOptions {
  /** Quando il server assegna l'id definitivo al posto del temp ottimistico. */
  onDeckIdRemap?: (fromId: string, toId: string) => void;
}

export function useServerDecks(initialDecks: Deck[], options: UseServerDecksOptions = {}) {
  const { onDeckIdRemap } = options;
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [dirtyDeckIds, setDirtyDeckIds] = useState<ReadonlySet<string>>(() => new Set());
  const [isPending, startTransition] = useTransition();

  const decksRef = useRef(decks);
  useEffect(() => {
    decksRef.current = decks;
  }, [decks]);

  const markDirty = useCallback((deckId: string) => {
    setDirtyDeckIds((prev) => (prev.has(deckId) ? prev : new Set(prev).add(deckId)));
  }, []);

  // Persistenza fuori dal ciclo di render. Gli updater di setState devono restare
  // puri: React li può rieseguire ad ogni tentativo di render, e lanciare lì una
  // server action (che fa revalidatePath → refresh → nuovo render) creava un loop
  // di sospensioni che crashava la pagina (React #482) aggiungendo carte in rapida
  // successione.
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

  // Flush alla smontatura: se il debounce era ancora in attesa, salva comunque.
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
          // Conserva le carte aggiunte localmente mentre la creazione era in volo:
          // il deck del server è vuoto e sovrascriverebbe il lavoro dell'utente.
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
    [onDeckIdRemap]
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
      patchDeck(deckId, (deck) => {
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
