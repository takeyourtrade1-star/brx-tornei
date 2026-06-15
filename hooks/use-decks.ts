'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Deck, DeckCard } from '@/types/deck';
import type { InventoryItem } from '@/types/inventory';
import type { CreateDeckInput } from '@/lib/validations/deck';

const STORAGE_KEY = 'ebartex-tournaments-decks';

function loadDecks(): Deck[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as Deck[]) : [];
  } catch {
    return [];
  }
}

function saveDecks(decks: Deck[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch {
    // localStorage pieno o disabilitato: i dati restano in memoria per la sessione.
  }
}

function generateDeckId(): string {
  return `deck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function findCardIndex(cards: DeckCard[], blueprintId: number): number {
  return cards.findIndex((c) => Number(c.id) === blueprintId);
}

export interface UseDecksReturn {
  decks: Deck[];
  isLoaded: boolean;
  createDeck: (input: CreateDeckInput) => Deck;
  deleteDeck: (deckId: string) => void;
  addCard: (
    deckId: string,
    inventoryItem: InventoryItem,
    section: 'main' | 'side'
  ) => { success: boolean; reason?: string };
  removeCard: (deckId: string, blueprintId: number, section: 'main' | 'side') => void;
  updateQuantity: (
    deckId: string,
    blueprintId: number,
    section: 'main' | 'side',
    quantity: number,
    maxQuantity: number
  ) => void;
  moveCard: (
    deckId: string,
    blueprintId: number,
    from: 'main' | 'side',
    to: 'main' | 'side'
  ) => void;
  getDeck: (deckId: string) => Deck | undefined;
}

export function useDecks(): UseDecksReturn {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setDecks(loadDecks());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) saveDecks(decks);
  }, [decks, isLoaded]);

  const getDeck = useCallback(
    (deckId: string) => decks.find((d) => d.id === deckId),
    [decks]
  );

  const createDeck = useCallback((input: CreateDeckInput): Deck => {
    const newDeck: Deck = {
      id: generateDeckId(),
      name: input.name,
      formatId: input.formatId,
      archetypeId: input.archetypeId,
      main: [],
      side: [],
      createdAt: new Date().toISOString(),
    };
    setDecks((prev) => [newDeck, ...prev]);
    return newDeck;
  }, []);

  const deleteDeck = useCallback((deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
  }, []);

  const addCard = useCallback(
    (
      deckId: string,
      inventoryItem: InventoryItem,
      section: 'main' | 'side'
    ): { success: boolean; reason?: string } => {
      if (inventoryItem.quantity <= 0) {
        return { success: false, reason: 'Carta non disponibile in inventario' };
      }

      setDecks((prev) => {
        const deck = prev.find((d) => d.id === deckId);
        if (!deck) return prev;

        const target = section === 'main' ? deck.main : deck.side;
        const idx = findCardIndex(target, inventoryItem.blueprintId);

        // Limite globale: non si può mettere nel mazzo più copie di quante se ne possiedano.
        const currentQty = idx >= 0 ? target[idx].quantity : 0;
        if (currentQty >= inventoryItem.quantity) {
          return prev;
        }

        const next = { ...deck };
        if (idx >= 0) {
          const nextSection = [...target];
          nextSection[idx] = { ...nextSection[idx], quantity: nextSection[idx].quantity + 1 };
          next[section] = nextSection;
        } else {
          const newCard: DeckCard = {
            ...inventoryItem.card,
            quantity: 1,
          };
          next[section] = [...target, newCard];
        }

        return prev.map((d) => (d.id === deckId ? next : d));
      });
      return { success: true };
    },
    []
  );

  const removeCard = useCallback(
    (deckId: string, blueprintId: number, section: 'main' | 'side') => {
      setDecks((prev) =>
        prev.map((d) => {
          if (d.id !== deckId) return d;
          const nextSection = d[section].filter((c) => Number(c.id) !== blueprintId);
          return { ...d, [section]: nextSection };
        })
      );
    },
    []
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
      setDecks((prev) =>
        prev.map((d) => {
          if (d.id !== deckId) return d;
          const nextSection = d[section].map((c) =>
            Number(c.id) === blueprintId ? { ...c, quantity: safeQty } : c
          );
          return { ...d, [section]: nextSection };
        })
      );
    },
    [removeCard]
  );

  const moveCard = useCallback(
    (deckId: string, blueprintId: number, from: 'main' | 'side', to: 'main' | 'side') => {
      if (from === to) return;
      setDecks((prev) =>
        prev.map((d) => {
          if (d.id !== deckId) return d;
          const source = d[from];
          const target = d[to];
          const idx = findCardIndex(source, blueprintId);
          if (idx < 0) return d;

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
          return { ...d, [from]: nextSource, [to]: nextTarget };
        })
      );
    },
    []
  );

  return {
    decks,
    isLoaded,
    createDeck,
    deleteDeck,
    addCard,
    removeCard,
    updateQuantity,
    moveCard,
    getDeck,
  };
}
