'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { InventoryMacroCard } from '@/components/feature/inventory/inventory-macro-card';
import { InventoryScanPanel } from '@/components/feature/inventory/inventory-scan-panel';
import { DeckBuilder } from '@/components/feature/decks/deck-builder';
import { DeckList } from '@/components/feature/decks/deck-list';
import { useServerDecks } from '@/components/feature/decks/use-server-decks';
import type { ResolveScanResult } from '@/types/resolve-scan';
import type { SessionUser } from '@/types/auth';
import type { Deck } from '@/types/deck';
import type { InventoryItem } from '@/types/inventory';
import type { CreateDeckInput } from '@/lib/validations/deck';

interface MazziWorkspaceProps {
  initialInventory: InventoryItem[];
  initialDecks: Deck[];
  user: SessionUser;
}

type Tab = 'inventario' | 'mazzi';

export function MazziWorkspace({ initialInventory, initialDecks, user }: MazziWorkspaceProps) {
  const [tab, setTab] = useState<Tab>('inventario');
  const [inventory, setInventory] = useState(initialInventory);
  const [search, setSearch] = useState('');
  const [deckView, setDeckView] = useState<'list' | 'builder'>('list');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);

  const handleDeckIdRemap = useCallback((fromId: string, toId: string) => {
    setEditingDeckId((current) => (current === fromId ? toId : current));
  }, []);

  const {
    decks,
    createDeck,
    deleteDeck,
    addCard,
    removeCard,
    updateQuantity,
    moveCard,
    getDeck,
    setDeckState,
    isPending,
  } = useServerDecks(initialDecks, { onDeckIdRemap: handleDeckIdRemap });

  const editingDeck = useMemo(
    () => (editingDeckId ? getDeck(editingDeckId) : undefined),
    [editingDeckId, getDeck]
  );

  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventory;
    return inventory.filter(
      (item) =>
        item.card.name.toLowerCase().includes(term) ||
        item.card.setName?.toLowerCase().includes(term) ||
        item.card.setCode?.toLowerCase().includes(term)
    );
  }, [inventory, search]);

  const handleCardAdded = (result: ResolveScanResult) => {
    setInventory((prev) => {
      const idx = prev.findIndex((i) => i.blueprintId === result.blueprintId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: result.inventoryItem.quantity,
          card: { ...next[idx].card, ...result.card },
        };
        return next;
      }
      return [...prev, result.inventoryItem];
    });
  };

  const handleCreateDeck = (input: CreateDeckInput) => {
    const deck = createDeck(input);
    setEditingDeckId(deck.id);
    setDeckView('builder');
    setTab('mazzi');
  };

  const handleDeckPatched = (deck: Deck) => {
    setDeckState(decks.map((d) => (d.id === deck.id ? deck : d)));
  };

  useEffect(() => {
    if (deckView === 'builder' && editingDeckId && !editingDeck) {
      setDeckView('list');
      setEditingDeckId(null);
    }
  }, [deckView, editingDeckId, editingDeck]);

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <DashboardHeader user={user} />

      <div className="mx-auto w-full max-w-content px-4 py-6 sm:px-6">
        <header className="mb-6">
          <h1 className="font-sans text-2xl font-bold text-white sm:text-3xl">
            Crea mazzo
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Scansiona le carte, costruisci l&apos;inventario e assembla mazzi per formato con
            verifica Scryfall e Camera Match.
          </p>
        </header>

        <div className="mb-6 flex gap-2">
          {(['inventario', 'mazzi'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                tab === key
                  ? 'bg-[#FF7300] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {key === 'inventario' ? 'Tutte le carte' : 'I miei mazzi'}
            </button>
          ))}
        </div>

        {tab === 'inventario' && (
          <div className="flex flex-col gap-6">
            <InventoryScanPanel onCardAdded={handleCardAdded} />
            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-sans text-lg font-semibold text-white">
                  Le tue carte ({inventory.length})
                </h2>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca per nome o set…"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#FF7300] focus:outline-none sm:max-w-xs"
                />
              </div>
              {filteredInventory.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                  <p className="text-sm font-bold text-white/80">Inventario vuoto</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredInventory.map((item) => (
                    <InventoryMacroCard key={item.blueprintId} item={item} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'mazzi' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            {deckView === 'builder' && editingDeck ? (
              <DeckBuilder
                deck={editingDeck}
                inventory={inventory}
                onBack={() => {
                  setDeckView('list');
                  setEditingDeckId(null);
                }}
                onAddCard={(item, section) => addCard(editingDeck.id, item, section)}
                onUpdateQuantity={(bp, section, qty, max) =>
                  updateQuantity(editingDeck.id, bp, section, qty, max)
                }
                onMoveCard={(bp, from, to) => moveCard(editingDeck.id, bp, from, to)}
                onRemoveCard={(bp, section) => removeCard(editingDeck.id, bp, section)}
                onDeleteDeck={() => {
                  deleteDeck(editingDeck.id);
                  setDeckView('list');
                  setEditingDeckId(null);
                }}
                onDeckPatched={handleDeckPatched}
              />
            ) : (
              <DeckList
                decks={decks}
                onCreate={handleCreateDeck}
                onEdit={(id) => {
                  setEditingDeckId(id);
                  setDeckView('builder');
                }}
                onDelete={deleteDeck}
                isCreating={isPending}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
