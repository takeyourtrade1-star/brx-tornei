'use client';

import { useMemo, useState } from 'react';
import { getFormat } from '@/lib/data/catalog';
import { getDeckArchetype } from '@/lib/data/deck-archetypes';
import { countCards, getMainDeckMinSize, getSideboardMaxSize } from '@/lib/data/deck-utils';
import type { Deck } from '@/types/deck';
import type { InventoryItem } from '@/types/inventory';
import { DeckCard } from './deck-card';
import { InventoryCard } from './inventory-card';

interface DeckBuilderProps {
  deck: Deck;
  inventory: InventoryItem[];
  onBack: () => void;
  onAddCard: (item: InventoryItem, section: 'main' | 'side') => void;
  onUpdateQuantity: (
    blueprintId: number,
    section: 'main' | 'side',
    quantity: number,
    maxQuantity: number
  ) => void;
  onMoveCard: (blueprintId: number, from: 'main' | 'side', to: 'main' | 'side') => void;
  onRemoveCard: (blueprintId: number, section: 'main' | 'side') => void;
  onDeleteDeck: () => void;
}

export function DeckBuilder({
  deck,
  inventory,
  onBack,
  onAddCard,
  onUpdateQuantity,
  onMoveCard,
  onRemoveCard,
  onDeleteDeck,
}: DeckBuilderProps) {
  const [search, setSearch] = useState('');

  const format = getFormat(deck.formatId);
  const archetype = getDeckArchetype(deck.archetypeId);
  const mainCount = countCards(deck.main);
  const sideCount = countCards(deck.side);
  const minMain = getMainDeckMinSize(deck.formatId);
  const maxSide = getSideboardMaxSize(deck.formatId);
  const isLegal = mainCount >= minMain && sideCount <= maxSide;

  const inventoryQty = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of inventory) {
      map.set(item.blueprintId, item.quantity);
    }
    return map;
  }, [inventory]);

  const deckMainQty = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of deck.main) map.set(Number(c.id), c.quantity);
    return map;
  }, [deck.main]);

  const deckSideQty = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of deck.side) map.set(Number(c.id), c.quantity);
    return map;
  }, [deck.side]);

  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventory;
    return inventory.filter((item) => item.card.name.toLowerCase().includes(term));
  }, [inventory, search]);

  const getCanAdd = (item: InventoryItem, section: 'main' | 'side') => {
    const owned = item.quantity;
    const usedMain = deckMainQty.get(item.blueprintId) ?? 0;
    const usedSide = deckSideQty.get(item.blueprintId) ?? 0;
    const usedTotal = usedMain + usedSide;
    if (usedTotal >= owned) return false;
    if (section === 'side' && maxSide > 0 && sideCount >= maxSide) return false;
    return true;
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold uppercase text-white transition-colors hover:bg-white/20"
            >
              ← Indietro
            </button>
            <h2 className="truncate font-display text-lg font-black uppercase tracking-wide text-white">
              {deck.name}
            </h2>
          </div>
          <p className="mt-1 text-xs text-white/50">
            {format?.name ?? deck.formatId} · {archetype?.name ?? deck.archetypeId}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
              isLegal
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {isLegal ? 'Legale' : 'In costruzione'}
          </span>
          <button
            type="button"
            onClick={onDeleteDeck}
            className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-bold uppercase text-red-300 transition-colors hover:bg-red-500/20"
          >
            Elimina
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4" style={{ height: 'min(600px, 58vh)' }}>
        {/* Inventario */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/70">
            Inventario
          </p>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca carta..."
            className="mb-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#FF7300] focus:outline-none"
          />
          <div className="flex min-h-0 flex-col gap-2 overflow-auto pr-1">
            {filteredInventory.length === 0 ? (
              <p className="text-center text-xs text-white/40">
                {search ? 'Nessuna carta trovata' : 'Inventario vuoto'}
              </p>
            ) : (
              filteredInventory.map((item) => {
                const bp = item.blueprintId;
                const mainQty = deckMainQty.get(bp) ?? 0;
                const sideQty = deckSideQty.get(bp) ?? 0;
                return (
                  <InventoryCard
                    key={bp}
                    item={item}
                    mainQty={mainQty}
                    sideQty={sideQty}
                    canAddMain={getCanAdd(item, 'main')}
                    canAddSide={getCanAdd(item, 'side')}
                    onAddMain={() => onAddCard(item, 'main')}
                    onAddSide={() => onAddCard(item, 'side')}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Main deck */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">Main deck</p>
            <span className="text-[10px] font-bold text-white/60">
              {mainCount}/{minMain}
            </span>
          </div>
          <div className="flex min-h-0 flex-col gap-2 overflow-auto pr-1">
            {deck.main.length === 0 ? (
              <p className="text-center text-xs text-white/40">Aggiungi carte dall’inventario</p>
            ) : (
              deck.main.map((card) => {
                const bp = Number(card.id);
                const max = (inventoryQty.get(bp) ?? 0) - (deckSideQty.get(bp) ?? 0);
                return (
                  <DeckCard
                    key={bp}
                    card={card}
                    maxQuantity={max}
                    onChangeQuantity={(q) => onUpdateQuantity(bp, 'main', q, max)}
                    onMove={() => onMoveCard(bp, 'main', 'side')}
                    onRemove={() => onRemoveCard(bp, 'main')}
                    moveLabel={maxSide > 0 ? '→ Side' : '→ Side'}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Sideboard */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">Sideboard</p>
            <span className="text-[10px] font-bold text-white/60">
              {sideCount}/{maxSide > 0 ? maxSide : '—'}
            </span>
          </div>
          <div className="flex min-h-0 flex-col gap-2 overflow-auto pr-1">
            {maxSide === 0 ? (
              <p className="text-center text-xs text-white/40">Commander non usa sideboard</p>
            ) : deck.side.length === 0 ? (
              <p className="text-center text-xs text-white/40">Aggiungi carte dall’inventario</p>
            ) : (
              deck.side.map((card) => {
                const bp = Number(card.id);
                const max = (inventoryQty.get(bp) ?? 0) - (deckMainQty.get(bp) ?? 0);
                return (
                  <DeckCard
                    key={bp}
                    card={card}
                    maxQuantity={max}
                    onChangeQuantity={(q) => onUpdateQuantity(bp, 'side', q, max)}
                    onMove={() => onMoveCard(bp, 'side', 'main')}
                    onRemove={() => onRemoveCard(bp, 'side')}
                    moveLabel="→ Main"
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
