'use client';

import { useState, useTransition } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { validateDeckLegalityAction } from '@/actions/decks';
import { getFormat } from '@/lib/data/catalog';
import { getDeckArchetype } from '@/lib/data/deck-archetypes';
import { countCards, getMainDeckMinSize } from '@/lib/data/deck-utils';
import { getDeckStructureIssues } from '@/lib/deck-structure';
import type { CardCatalogHit } from '@/types/card';
import type { DeckLegalityIssue } from '@/types/card-legality';
import type { Deck } from '@/types/deck';
import { DeckBuilderSections } from './deck-builder-sections';
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
  onSetCommander?: (blueprintId: number) => void;
  onConfirmDeck?: () => void;
  onDeleteDeck: () => void;
  onDeckPatched?: (deck: Deck) => void;
  confirming?: boolean;
  saveError?: string | null;
}

export function DeckBuilder({
  deck,
  onBack,
  onAddCard,
  onUpdateQuantity,
  onMoveCard,
  onRemoveCard,
  onSetCommander,
  onConfirmDeck,
  onDeleteDeck,
  onDeckPatched,
  confirming = false,
  saveError,
}: DeckBuilderProps) {
  const [legalityIssues, setLegalityIssues] = useState<DeckLegalityIssue[]>(
    deck.legalityErrors ?? []
  );
  const [legal, setLegal] = useState<boolean | undefined>(undefined);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const format = getFormat(deck.formatId);
  const archetype = getDeckArchetype(deck.archetypeId);
  const mainCount = countCards(deck.main);
  const targetMain = getMainDeckMinSize(deck.formatId);
  const structureIssues = getDeckStructureIssues(deck);
  const structureComplete = structureIssues.length === 0;

  const legalityBadge = (() => {
    if (legal === true) return 'bg-emerald-500/20 text-emerald-300';
    if (legal === false) return 'bg-red-500/20 text-red-300';
    if (deck.legalityErrors && deck.legalityErrors.length > 0) {
      return 'bg-amber-500/20 text-amber-300';
    }
    return 'bg-white/10 text-white/45';
  })();

  const legalityLabel = (() => {
    if (legal === true) return 'Legale';
    if (legal === false) return 'Non legale';
    if (deck.legalityCheckedAt) return 'Verificato';
    return 'Da verificare';
  })();

  const runLegalityCheck = () => {
    setCheckError(null);
    startTransition(async () => {
      const res = await validateDeckLegalityAction({ deckId: deck.id, formatId: deck.formatId });
      if ('error' in res) {
        // L'errore va mostrato: senza feedback il bottone sembra morto/finto.
        setCheckError(res.error);
        return;
      }
      setLegalityIssues(res.issues);
      setLegal(res.legal);
      if (res.deck) onDeckPatched?.(res.deck);
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="arena-back !rounded-xl px-3 py-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Indietro
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
              structureComplete ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {structureComplete ? `${mainCount}/${targetMain} pronto` : 'In costruzione'}
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
          <button
            type="button"
            onClick={onConfirmDeck}
            disabled={!onConfirmDeck || !structureComplete || confirming || deck.id.startsWith('temp-')}
            title={structureIssues[0]?.message}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-3 py-1.5 text-xs font-black uppercase text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {confirming ? 'Salvataggio…' : 'Conferma mazzo'}
          </button>
        </div>
      </div>

      {!structureComplete && (
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100">
          {structureIssues[0]?.message}
        </p>
      )}
      {saveError && (
        <p role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
          {saveError}
        </p>
      )}

      <DeckLegalityPanel
        issues={legalityIssues}
        loading={isPending}
        legal={legal}
        error={checkError}
      />

      <DeckBuilderSections
        deck={deck}
        onAddCard={onAddCard}
        onUpdateQuantity={onUpdateQuantity}
        onMoveCard={onMoveCard}
        onRemoveCard={onRemoveCard}
        onSetCommander={onSetCommander ?? (() => undefined)}
      />
    </div>
  );
}
