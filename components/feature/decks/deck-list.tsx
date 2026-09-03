'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CircleCheck,
  Layers3,
  Plus,
  Sparkles,
} from 'lucide-react';
import { MAX_DECKS_PER_USER } from '@/lib/deck-limits';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { Deck } from '@/types/deck';
import { CreateDeckForm } from './create-deck-form';
import { DeckListCard } from './deck-list-card';

interface DeckListProps {
  decks: Deck[];
  onCreate: (input: CreateDeckInput) => void;
  onEdit: (deckId: string) => void;
  onDelete: (deckId: string) => void;
  isCreating?: boolean;
  error?: string | null;
  onClearError?: () => void;
  successMessage?: string | null;
  onClearSuccess?: () => void;
  autoCreate?: boolean;
  onAutoCreateConsumed?: () => void;
}

export function DeckList({
  decks,
  onCreate,
  onEdit,
  onDelete,
  isCreating = false,
  error,
  onClearError,
  successMessage,
  onClearSuccess,
  autoCreate = false,
  onAutoCreateConsumed,
}: DeckListProps) {
  const [creating, setCreating] = useState(autoCreate && decks.length < MAX_DECKS_PER_USER);
  const isLimitReached = decks.length >= MAX_DECKS_PER_USER;

  useEffect(() => {
    if (autoCreate && !isLimitReached) setCreating(true);
  }, [autoCreate, isLimitReached]);

  const handleCreate = (input: CreateDeckInput) => {
    onCreate(input);
    setCreating(false);
    onAutoCreateConsumed?.();
  };

  const startCreating = () => {
    onClearError?.();
    onClearSuccess?.();
    setCreating(true);
  };

  if (creating) {
    return (
      <div>
        {successMessage ? (
          <Notice tone="success" message={successMessage} onClose={onClearSuccess} />
        ) : null}
        {error ? <Notice tone="error" message={error} onClose={onClearError} /> : null}
        <CreateDeckForm
          onCreate={handleCreate}
          onCancel={() => {
            setCreating(false);
            onAutoCreateConsumed?.();
          }}
          isSubmitting={isCreating}
        />
      </div>
    );
  }

  return (
    <section className="arena-panel overflow-visible p-4 sm:p-6">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-r from-primary/10 via-primary/[0.02] to-transparent" aria-hidden />
      <div className="relative">
        {error ? (
          <Notice tone="error" message={error} onClose={onClearError} />
        ) : null}
        {successMessage ? (
          <Notice tone="success" message={successMessage} onClose={onClearSuccess} />
        ) : null}

        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-lg shadow-primary/10">
              <Layers3 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-xl font-black uppercase tracking-wide text-white sm:text-2xl">
                  I miei deck
                </h2>
                <span className="rounded-md border border-white/15 border-l-2 border-l-primary/70 bg-slate-950/55 px-2.5 py-1 text-[10px] font-black text-white/65">
                  {decks.length}/{MAX_DECKS_PER_USER}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/40">Costruisci il mazzo con le stesse carte fisiche o proxy che porterai al tavolo.</p>
            </div>
          </div>

          {isLimitReached ? (
            <span className="rounded-md border border-amber-400/25 border-l-2 border-l-amber-300 bg-slate-950/55 px-3.5 py-2 text-[10px] font-black uppercase tracking-wide text-amber-200">
              Tutti gli slot occupati
            </span>
          ) : (
            <button type="button" onClick={startCreating} disabled={isCreating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-red-500 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              Nuovo mazzo
            </button>
          )}
        </header>

        {decks.length === 0 ? (
          <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-white/15 bg-white/[0.025] px-6 text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25">
                <Sparkles className="h-6 w-6" aria-hidden />
              </span>
              <p className="mt-4 font-display text-lg font-black uppercase text-white">Il primo slot è vuoto</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/45">Dagli un nome, scegli il formato e incolla la tua lista: il builder fa il resto.</p>
              <button type="button" onClick={startCreating} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-primary/20">
                Crea il primo mazzo
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {decks.map((deck) => (
              <DeckListCard key={deck.id} deck={deck} onEdit={() => onEdit(deck.id)} onDelete={() => onDelete(deck.id)} />
            ))}
            {Array.from({ length: MAX_DECKS_PER_USER - decks.length }, (_, index) => (
              <button key={`empty-slot-${index}`} type="button" onClick={startCreating} className="group aspect-[5/7] min-h-[26rem] rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-left transition hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/[0.035]">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.06] text-white/45 ring-1 ring-white/10 transition group-hover:bg-primary/15 group-hover:text-primary group-hover:ring-primary/30">
                  <Plus className="h-5 w-5" aria-hidden />
                </span>
                <span className="mt-12 block text-[9px] font-black uppercase tracking-[0.18em] text-white/25">Slot {decks.length + index + 1}</span>
                <span className="mt-1 block font-display text-base font-black uppercase text-white/75 group-hover:text-white">Nuovo mazzo</span>
                <span className="mt-1 block max-w-xs text-xs leading-relaxed text-white/35">Crea la base in pochi secondi, poi importa l’intera decklist.</span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-primary">Inizia ora <ArrowRight className="h-3.5 w-3.5" /></span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Notice({ tone, message, onClose }: {
  tone: 'error' | 'success';
  message: string;
  onClose?: () => void;
}) {
  const success = tone === 'success';
  const Icon = success ? CircleCheck : AlertCircle;
  return (
    <div role={success ? 'status' : 'alert'} className={`mb-4 flex items-center justify-between rounded-xl border p-3 text-xs font-semibold ${success ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100' : 'border-red-400/25 bg-red-500/10 text-red-200'}`}>
      <span className="flex items-center gap-2"><Icon className="h-4 w-4 shrink-0" />{message}</span>
      {onClose ? <button type="button" onClick={onClose} className="text-[10px] font-black uppercase underline hover:no-underline">Chiudi</button> : null}
    </div>
  );
}
