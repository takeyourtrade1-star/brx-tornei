'use client';

import { useMemo, useState, useTransition } from 'react';
import { ShieldCheck } from 'lucide-react';
import { validateDeckLegalityAction } from '@/actions/decks';
import { getFormat } from '@/lib/data/catalog';
import { getDeckArchetype } from '@/lib/data/deck-archetypes';
import { getMaxQuantityForDeckRow } from '@/lib/deck-copy-limits';
import { countCards, getMainDeckMinSize, getSideboardMaxSize } from '@/lib/data/deck-utils';
import type { CardCatalogHit } from '@/types/card';
import type { DeckLegalityIssue } from '@/types/card-legality';
import type { Deck } from '@/types/deck';
import { DeckCard } from './deck-card';
import { DeckCardSearch } from './deck-card-search';
import { DeckLegalityPanel } from './deck-legality-panel';

interface DeckBuilderProps {
  deck: Deck;
  onBack: () => void;
  onAddCard: (card: CardCatalogHit, section: 'main' | 'side') => void;
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
  onBack,
  onAddCard,
  onUpdateQuantity,
  onMoveCard,
  onRemoveCard,
  onDeleteDeck,
  onDeckPatched,
}: DeckBuilderProps) {
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

  const legalityBadge = (() => {
    if (legal === true) return 'bg-emerald-500/20 text-emerald-300';
    if (legal === false) return 'bg-red-500/20 text-red-300';
    if (deck.legalityErrors && deck.legalityErrors.length > 0) {
      return 'bg-amber-500/20 text-amber-300';
    }
    return 'bg-white/10 text-white/50';
  })();

  const legalityLabel = (() => {
    if (legal === true) return 'Legale';
    if (legal === false) return 'Non legale';
    if (deck.legalityCheckedAt) return 'Verificato';
    return 'Da verificare';
  })();

  const runLegalityCheck = () => {
    startTransition(async () => {
      const res = await validateDeckLegalityAction({ deckId: deck.id, formatId: deck.formatId });
      if ('error' in res) return;
      setLegalityIssues(res.issues);
      setLegal(res.legal);
      if (res.deck) onDeckPatched?.(res.deck);
    });
  };

  const mainMaxQty = useMemo(() => {
    const map = new Map<number, number>();
    for (const card of deck.main) {
      map.set(Number(card.id), getMaxQuantityForDeckRow(deck.formatId, card, deck.main, deck.side, 'main'));
    }
    return map;
  }, [deck.formatId, deck.main, deck.side]);

  const sideMaxQty = useMemo(() => {
    const map = new Map<number, number>();
    for (const card of deck.side) {
      map.set(Number(card.id), getMaxQuantityForDeckRow(deck.formatId, card, deck.main, deck.side, 'side'));
    }
    return map;
  }, [deck.formatId, deck.main, deck.side]);

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
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${legalityBadge}`}>
            {legalityLabel}
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
            className="inline-flex items-center gap-1 rounded-lg bg-[#FF7300]/20 px-3 py-1 text-xs font-bold uppercase text-[#FF7300] ring-1 ring-[#FF7300]/25 disabled:opacity-50"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Verifica legalità
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
          <DeckCardSearch
            formatId={deck.formatId}
            main={deck.main}
            side={deck.side}
            sideCount={sideCount}
            onAddCard={onAddCard}
          />
        </div>

        <div className="flex min-h-[280px] flex-col rounded-2xl border border-white/10 bg-white/5 p-3 lg:min-h-0">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-display text-xs font-black uppercase tracking-wide text-white/80">
              Main deck
            </p>
            <span
              className={`text-[11px] font-bold ${mainCount >= minMain ? 'text-emerald-300' : 'text-white/60'}`}
            >
              {mainCount}/{minMain}
            </span>
          </div>
          <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${minMain > 0 ? Math.min(100, Math.round((mainCount / minMain) * 100)) : 100}%`,
                backgroundColor: mainCount >= minMain ? '#34d399' : '#FF7300',
              }}
            />
          </div>
          <div className="flex min-h-0 flex-col gap-2 overflow-auto pr-1">
            {deck.main.length === 0 ? (
              <p className="py-6 text-center text-xs text-white/35">
                Cerca una carta e aggiungila al main deck
              </p>
            ) : (
              deck.main.map((card) => {
                const bp = Number(card.id);
                const max = mainMaxQty.get(bp) ?? 4;
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
              })
            )}
          </div>
        </div>

        <div className="flex min-h-[280px] flex-col rounded-2xl border border-white/10 bg-white/5 p-3 lg:min-h-0">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-xs font-black uppercase tracking-wide text-white/80">
              Sideboard
            </p>
            <span className="text-[11px] font-bold text-white/60">
              {sideCount}/{maxSide > 0 ? maxSide : '—'}
            </span>
          </div>
          <div className="flex min-h-0 flex-col gap-2 overflow-auto pr-1">
            {maxSide === 0 ? (
              <p className="text-center text-xs text-white/40">Commander non usa sideboard</p>
            ) : deck.side.length === 0 ? (
              <p className="py-6 text-center text-xs text-white/35">
                Aggiungi carte al sideboard dalla ricerca
              </p>
            ) : (
              deck.side.map((card) => {
                const bp = Number(card.id);
                const max = sideMaxQty.get(bp) ?? 4;
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
