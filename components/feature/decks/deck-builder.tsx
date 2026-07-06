'use client';

import { useMemo, useState, useTransition } from 'react';
import { Camera, ShieldCheck } from 'lucide-react';
import { validateDeckLegalityAction } from '@/actions/decks';
import { addScannedCardAction } from '@/actions/inventory';
import { getFormat } from '@/lib/data/catalog';
import { getDeckArchetype } from '@/lib/data/deck-archetypes';
import { countCards, getMainDeckMinSize, getSideboardMaxSize } from '@/lib/data/deck-utils';
import { ScannerModal } from '@/components/feature/scanner/ScannerModal';
import type { ScanResult } from '@/hooks/scanner/scanner-types';
import type { DeckLegalityIssue } from '@/types/card-legality';
import type { Deck } from '@/types/deck';
import type { InventoryItem } from '@/types/inventory';
import { DeckCard } from './deck-card';
import { DeckLegalityPanel } from './deck-legality-panel';
import { DeckVerifyWizard } from './deck-verify-wizard';
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
  onDeckPatched?: (deck: Deck) => void;
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
  onDeckPatched,
}: DeckBuilderProps) {
  const [search, setSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [legalityIssues, setLegalityIssues] = useState<DeckLegalityIssue[]>(
    deck.legalityErrors ?? []
  );
  const [legal, setLegal] = useState<boolean | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const format = getFormat(deck.formatId);
  const archetype = getDeckArchetype(deck.archetypeId);
  const mainCount = countCards(deck.main);
  const sideCount = countCards(deck.side);
  const minMain = getMainDeckMinSize(deck.formatId);
  const maxSide = getSideboardMaxSize(deck.formatId);
  const isSizeLegal = mainCount >= minMain && sideCount <= maxSide;

  const inventoryQty = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of inventory) map.set(item.blueprintId, item.quantity);
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
    const usedMain = deckMainQty.get(item.blueprintId) ?? 0;
    const usedSide = deckSideQty.get(item.blueprintId) ?? 0;
    if (usedMain + usedSide >= item.quantity) return false;
    if (section === 'side' && maxSide > 0 && sideCount >= maxSide) return false;
    return true;
  };

  const runLegalityCheck = () => {
    startTransition(async () => {
      const res = await validateDeckLegalityAction({ deckId: deck.id, formatId: deck.formatId });
      if ('error' in res) return;
      setLegalityIssues(res.issues);
      setLegal(res.legal);
      if (res.deck) onDeckPatched?.(res.deck);
    });
  };

  const handleScanResult = (scan: ScanResult) => {
    startTransition(async () => {
      const res = await addScannedCardAction({
        cardName: scan.card_name,
        setCode: scan.set_code,
        setName: scan.set_name,
        imageUri: scan.image_uri,
      });
      if ('error' in res) return;
      setSearch(scan.card_name);
      const item = inventory.find((i) => i.blueprintId === res.data.blueprintId) ?? {
        ...res.data.inventoryItem,
      };
      onAddCard(item, 'main');
    });
  };

  const verificationBadge = (() => {
    switch (deck.verificationStatus) {
      case 'verified':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'mismatch':
        return 'bg-red-500/20 text-red-300';
      case 'scanned':
      case 'declared':
        return 'bg-amber-500/20 text-amber-300';
      default:
        return 'bg-white/10 text-white/50';
    }
  })();

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold uppercase text-white hover:bg-white/20"
            >
              ← Indietro
            </button>
            <h2 className="truncate font-display text-lg font-black uppercase text-white">
              {deck.name}
            </h2>
          </div>
          <p className="mt-1 text-xs text-white/50">
            {format?.name ?? deck.formatId} · {archetype?.name ?? deck.archetypeId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${verificationBadge}`}>
            {deck.verificationStatus === 'verified'
              ? 'Verificato'
              : deck.verificationStatus === 'mismatch'
                ? 'Discrepanza'
                : 'Non verificato'}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
              isSizeLegal ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {isSizeLegal ? 'Dimensioni OK' : 'In costruzione'}
          </span>
          <button
            type="button"
            onClick={runLegalityCheck}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-xs font-bold uppercase text-white"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Scryfall
          </button>
          <button
            type="button"
            onClick={() => setVerifyOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#FF7300]/20 px-3 py-1 text-xs font-bold uppercase text-[#FF7300]"
          >
            <Camera className="h-3.5 w-3.5" />
            Verifica fisica
          </button>
          <button
            type="button"
            onClick={onDeleteDeck}
            className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-bold uppercase text-red-300"
          >
            Elimina
          </button>
        </div>
      </div>

      <DeckLegalityPanel issues={legalityIssues} loading={isPending} legal={legal} />

      <div className="grid min-h-[420px] grid-cols-1 gap-4 lg:grid-cols-3 lg:min-h-[520px]">
        <div className="flex min-h-[280px] flex-col rounded-2xl border border-white/10 bg-white/5 p-3 lg:min-h-0">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-white/70">Inventario</p>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="rounded-md bg-[#FF7300]/20 p-1.5 text-[#FF7300]"
              aria-label="Scansiona carta"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca carta..."
            className="mb-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#FF7300] focus:outline-none"
          />
          <div className="flex min-h-0 flex-col gap-2 overflow-auto pr-1">
            {filteredInventory.map((item) => (
              <InventoryCard
                key={item.blueprintId}
                item={item}
                mainQty={deckMainQty.get(item.blueprintId) ?? 0}
                sideQty={deckSideQty.get(item.blueprintId) ?? 0}
                canAddMain={getCanAdd(item, 'main')}
                canAddSide={getCanAdd(item, 'side')}
                onAddMain={() => onAddCard(item, 'main')}
                onAddSide={() => onAddCard(item, 'side')}
              />
            ))}
          </div>
        </div>

        <div className="flex min-h-[280px] flex-col rounded-2xl border border-white/10 bg-white/5 p-3 lg:min-h-0">
          <div className="mb-2 flex justify-between">
            <p className="text-xs font-bold uppercase text-white/70">Main deck</p>
            <span className="text-[10px] font-bold text-white/60">
              {mainCount}/{minMain}
            </span>
          </div>
          <div className="flex min-h-0 flex-col gap-2 overflow-auto pr-1">
            {deck.main.map((card) => {
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
                  moveLabel="→ Side"
                />
              );
            })}
          </div>
        </div>

        <div className="flex min-h-[280px] flex-col rounded-2xl border border-white/10 bg-white/5 p-3 lg:min-h-0">
          <div className="mb-2 flex justify-between">
            <p className="text-xs font-bold uppercase text-white/70">Sideboard</p>
            <span className="text-[10px] font-bold text-white/60">
              {sideCount}/{maxSide > 0 ? maxSide : '—'}
            </span>
          </div>
          <div className="flex min-h-0 flex-col gap-2 overflow-auto pr-1">
            {maxSide === 0 ? (
              <p className="text-center text-xs text-white/40">Commander non usa sideboard</p>
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

      {scannerOpen && (
        <ScannerModal
          batchMode
          onConfirm={() => {}}
          onConfirmResult={handleScanResult}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {verifyOpen && (
        <DeckVerifyWizard
          deck={deck}
          onClose={() => setVerifyOpen(false)}
          onVerified={(d) => {
            onDeckPatched?.(d);
            setVerifyOpen(false);
          }}
        />
      )}
    </div>
  );
}
