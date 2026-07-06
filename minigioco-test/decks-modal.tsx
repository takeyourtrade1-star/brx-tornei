'use client';

import { useMemo, useState } from 'react';
import { useDecks } from '@/hooks/use-decks';
import type { InventoryItem } from '@/types/inventory';
import type { CreateDeckInput } from '@/lib/validations/deck';
import { DeckBuilder } from './deck-builder';
import { DeckList } from './deck-list';

interface DecksModalProps {
  inventory: InventoryItem[];
}

export function DecksModal({ inventory }: DecksModalProps) {
  const { decks, createDeck, deleteDeck, addCard, removeCard, updateQuantity, moveCard, getDeck } =
    useDecks();
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);

  const editingDeck = useMemo(
    () => (editingDeckId ? getDeck(editingDeckId) : undefined),
    [editingDeckId, getDeck]
  );

  const handleCreate = (input: CreateDeckInput) => {
    const deck = createDeck(input);
    setEditingDeckId(deck.id);
    setView('builder');
    return deck;
  };

  const handleEdit = (deckId: string) => {
    setEditingDeckId(deckId);
    setView('builder');
  };

  const handleBack = () => {
    setView('list');
    setEditingDeckId(null);
  };

  const handleDelete = () => {
    if (editingDeckId) {
      deleteDeck(editingDeckId);
    }
    handleBack();
  };

  if (view === 'builder' && editingDeck) {
    return (
      <DeckBuilder
        deck={editingDeck}
        inventory={inventory}
        onBack={handleBack}
        onAddCard={(item, section) => addCard(editingDeck.id, item.card, section)}
        onUpdateQuantity={(bp, section, qty, max) =>
          updateQuantity(editingDeck.id, bp, section, qty, max)
        }
        onMoveCard={(bp, from, to) => moveCard(editingDeck.id, bp, from, to)}
        onRemoveCard={(bp, section) => removeCard(editingDeck.id, bp, section)}
        onDeleteDeck={handleDelete}
      />
    );
  }

  return (
    <DeckList
      decks={decks}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={deleteDeck}
    />
  );
}
