'use client';

import { useState } from 'react';
import { Plus, Hammer, AlertCircle, CircleCheck } from 'lucide-react';
import { MAX_DECKS_PER_USER } from '@/lib/deck-limits';
import type { Deck } from '@/types/deck';
import { CreateDeckForm } from './create-deck-form';
import { DeckListCard } from './deck-list-card';
import type { CreateDeckInput } from '@/lib/validations/deck';

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
  const [creating, setCreating] = useState(
    autoCreate && decks.length < MAX_DECKS_PER_USER,
  );

  const isLimitReached = decks.length >= MAX_DECKS_PER_USER;

  const handleCreate = (input: CreateDeckInput) => {
    onCreate(input);
    setCreating(false);
    onAutoCreateConsumed?.();
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-xs font-semibold text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              className="text-[11px] font-bold underline hover:no-underline"
            >
              Chiudi
            </button>
          )}
        </div>
      )}

      {successMessage && (
        <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-100">
          <div className="flex items-center gap-2">
            <CircleCheck className="h-4 w-4 shrink-0 text-emerald-300" />
            <span>{successMessage}</span>
          </div>
          {onClearSuccess && (
            <button type="button" onClick={onClearSuccess} className="text-[11px] font-bold underline hover:no-underline">
              Chiudi
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-black uppercase tracking-wide text-white">
            I miei deck
          </h2>
          <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-black text-white/70">
            {decks.length}/{MAX_DECKS_PER_USER}
          </span>
        </div>
        {!creating && (
          isLimitReached ? (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-300">
              Limite {MAX_DECKS_PER_USER}/{MAX_DECKS_PER_USER} mazzi
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              disabled={isCreating}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_18px_rgba(255,115,0,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Nuovo mazzo
            </button>
          )
        )}
      </div>

      {creating && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5">
          <p className="mb-4 font-display text-sm font-black uppercase tracking-wide text-white">
            Nuovo mazzo
          </p>
          <CreateDeckForm
            onCreate={handleCreate}
            onCancel={() => {
              setCreating(false);
              onAutoCreateConsumed?.();
            }}
            isSubmitting={isCreating}
          />
        </div>
      )}

      {decks.length === 0 && !creating ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF7300]/15 text-[#FF7300]">
            <Hammer className="h-6 w-6" />
          </div>
          <p className="font-display text-base font-black uppercase tracking-wide text-white">
            Nessun mazzo
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-white/55">
            Crea il tuo primo mazzo usando le carte del tuo inventario.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Crea mazzo
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {decks.map((deck) => (
            <DeckListCard
              key={deck.id}
              deck={deck}
              onEdit={() => onEdit(deck.id)}
              onDelete={() => onDelete(deck.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
