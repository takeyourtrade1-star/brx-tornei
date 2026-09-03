'use client';

import { useState, useTransition } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Trash2 } from 'lucide-react';
import { validateDeckLegalityAction } from '@/actions/deck-legality';
import { getFormat } from '@/lib/data/catalog';
import { getDeckArchetype } from '@/lib/data/deck-archetypes';
import { countCards, getMainDeckMinSize } from '@/lib/data/deck-utils';
import { FORMAT_MEDIA } from '@/lib/data/format-media';
import { getDeckStructureIssues } from '@/lib/deck-structure';
import type { CardCatalogHit } from '@/types/card';
import type { DeckLegalityIssue } from '@/types/card-legality';
import type { Deck } from '@/types/deck';
import { DeckBuilderSections } from './deck-builder-sections';
import { DeckLegalityPanel } from './deck-legality-panel';

interface DeckBuilderProps {
  deck: Deck;
  onBack: () => void;
  onAddCard: (card: CardCatalogHit, section: 'main' | 'side', quantity?: number) => void;
  onUpdateQuantity: (
    blueprintId: number,
    section: 'main' | 'side',
    quantity: number,
    maxQuantity: number,
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
  const [legalityIssues, setLegalityIssues] = useState<DeckLegalityIssue[]>(deck.legalityErrors ?? []);
  const [legal, setLegal] = useState<boolean | undefined>(undefined);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const format = getFormat(deck.formatId);
  const archetype = getDeckArchetype(deck.archetypeId);
  const mainCount = countCards(deck.main);
  const targetMain = getMainDeckMinSize(deck.formatId);
  const structureIssues = getDeckStructureIssues(deck);
  const structureComplete = structureIssues.length === 0;
  const progress = Math.min(100, Math.round((mainCount / targetMain) * 100));
  const isTemporary = deck.id.startsWith('temp-');

  const legalityBadge = legal === true
    ? 'bg-emerald-500/20 text-emerald-300'
    : legal === false
      ? 'bg-red-500/20 text-red-300'
      : deck.legalityErrors && deck.legalityErrors.length > 0
        ? 'bg-amber-500/20 text-amber-300'
        : 'bg-white/10 text-white/45';
  const legalityLabel = legal === true
    ? 'Legale'
    : legal === false
      ? 'Non legale'
      : deck.legalityCheckedAt ? 'Verificato' : 'Da verificare';

  const runLegalityCheck = () => {
    setCheckError(null);
    startTransition(async () => {
      const result = await validateDeckLegalityAction({ deckId: deck.id, formatId: deck.formatId });
      if ('error' in result) {
        setCheckError(result.error);
        return;
      }
      setLegalityIssues(result.issues);
      setLegal(result.legal);
      if (result.deck) onDeckPatched?.(result.deck);
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 p-4 sm:p-5">
        <span className="absolute inset-y-0 right-0 hidden w-2/5 bg-cover bg-center opacity-20 sm:block" style={{ backgroundImage: `url(${FORMAT_MEDIA[deck.formatId].image})` }} aria-hidden />
        <span className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/35" aria-hidden />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button type="button" onClick={onBack} className="arena-back !rounded-xl px-3 py-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                I miei deck
              </button>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Deck studio</p>
              <h2 className="truncate font-display text-2xl font-black uppercase text-white sm:text-3xl">{deck.name}</h2>
              <p className="mt-1 text-xs font-semibold text-white/45">
                {format?.name ?? deck.formatId} · {archetype?.name ?? deck.archetypeId}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${legalityBadge}`}>{legalityLabel}</span>
              <button type="button" onClick={runLegalityCheck} disabled={isPending || isTemporary} className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-[10px] font-black uppercase text-primary transition hover:bg-primary/20 disabled:opacity-40">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isPending ? 'Controllo…' : 'Verifica legalità'}
              </button>
              <button type="button" onClick={() => {
                if (confirmDelete) onDeleteDeck();
                else setConfirmDelete(true);
              }} onBlur={() => setConfirmDelete(false)} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase transition ${confirmDelete ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-300 hover:bg-red-500/20'}`}>
                <Trash2 className="h-3.5 w-3.5" />
                {confirmDelete ? 'Conferma' : 'Elimina'}
              </button>
              <button type="button" onClick={onConfirmDeck} disabled={!onConfirmDeck || !structureComplete || confirming || isTemporary} title={structureIssues[0]?.message} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-red-500 px-3.5 py-2 text-[10px] font-black uppercase text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {confirming ? 'Salvataggio…' : 'Salva mazzo'}
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-white/45">
                <span>{structureComplete ? 'Struttura completa' : `${targetMain - mainCount} carte mancanti`}</span>
                <span className={structureComplete ? 'text-emerald-300' : 'text-white/70'}>{mainCount}/{targetMain}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <span className={`block h-full rounded-full transition-all duration-500 ${structureComplete ? 'bg-emerald-400' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className={`justify-self-start rounded-full px-3 py-1 text-[10px] font-black uppercase sm:justify-self-end ${structureComplete ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-200'}`}>
              {structureComplete ? 'Pronto per il tavolo' : 'In costruzione'}
            </span>
          </div>
        </div>
      </header>

      {!structureComplete ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100">{structureIssues[0]?.message}</p>
      ) : null}
      {saveError ? (
        <p role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{saveError}</p>
      ) : null}

      <DeckLegalityPanel issues={legalityIssues} loading={isPending} legal={legal} error={checkError} />
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
