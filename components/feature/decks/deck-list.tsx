'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck, AlertTriangle, Hammer, AlertCircle } from 'lucide-react';
import { getFormat } from '@/lib/data/catalog';
import { getDeckArchetype } from '@/lib/data/deck-archetypes';
import { getMainDeckMinSize, getSideboardMaxSize, countCards } from '@/lib/data/deck-utils';
import { MAX_DECKS_PER_USER } from '@/lib/deck-limits';
import type { Deck } from '@/types/deck';
import { CreateDeckForm, FORMAT_META } from './create-deck-form';
import type { CreateDeckInput } from '@/lib/validations/deck';

interface DeckListProps {
  decks: Deck[];
  onCreate: (input: CreateDeckInput) => void;
  onEdit: (deckId: string) => void;
  onDelete: (deckId: string) => void;
  isCreating?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

type Status = 'verified' | 'mismatch' | 'legal' | 'building';

const STATUS_META: Record<Status, { label: string; className: string; Icon: typeof ShieldCheck }> = {
  verified: { label: 'Verificato', className: 'bg-emerald-100 text-emerald-700', Icon: ShieldCheck },
  mismatch: { label: 'Discrepanza', className: 'bg-red-100 text-red-600', Icon: AlertTriangle },
  legal: { label: 'Legale', className: 'bg-emerald-100 text-emerald-700', Icon: ShieldCheck },
  building: { label: 'In costruzione', className: 'bg-amber-100 text-amber-700', Icon: Hammer },
};

export function DeckList({
  decks,
  onCreate,
  onEdit,
  onDelete,
  isCreating = false,
  error,
  onClearError,
}: DeckListProps) {
  const [creating, setCreating] = useState(false);

  const isLimitReached = decks.length >= MAX_DECKS_PER_USER;

  const handleCreate = (input: CreateDeckInput) => {
    onCreate(input);
    setCreating(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-600">
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

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-black uppercase tracking-wide text-header-bg">
            I miei deck
          </h2>
          <span className="rounded-full border border-slate-900/10 bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-600">
            {decks.length}/{MAX_DECKS_PER_USER}
          </span>
        </div>
        {!creating && (
          isLimitReached ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700">
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
        <div className="rounded-2xl border border-primary/25 bg-primary/[0.03] p-4 sm:p-5">
          <p className="mb-4 font-display text-sm font-black uppercase tracking-wide text-header-bg">
            Nuovo mazzo
          </p>
          <CreateDeckForm
            onCreate={handleCreate}
            onCancel={() => setCreating(false)}
            isSubmitting={isCreating}
          />
        </div>
      )}

      {decks.length === 0 && !creating ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-900/15 bg-slate-50/60 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF7300]/15 text-[#FF7300]">
            <Hammer className="h-6 w-6" />
          </div>
          <p className="font-display text-base font-black uppercase tracking-wide text-header-bg">
            Nessun mazzo
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-slate-500">
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
          {decks.map((deck) => {
            const format = getFormat(deck.formatId);
            const archetype = getDeckArchetype(deck.archetypeId);
            const mainCount = countCards(deck.main);
            const sideCount = countCards(deck.side);
            const minSize = getMainDeckMinSize(deck.formatId);
            const maxSide = getSideboardMaxSize(deck.formatId);
            const isLegal = mainCount >= minSize && sideCount <= maxSide;
            const accent = FORMAT_META[deck.formatId]?.color ?? '#FF7300';
            const progress = minSize > 0 ? Math.min(100, Math.round((mainCount / minSize) * 100)) : 100;

            const status: Status =
              deck.verificationStatus === 'verified'
                ? 'verified'
                : deck.verificationStatus === 'mismatch'
                  ? 'mismatch'
                  : isLegal
                    ? 'legal'
                    : 'building';
            const { label, className, Icon } = STATUS_META[status];

            return (
              <div
                key={deck.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-900/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-900/[0.14] hover:shadow-[0_8px_24px_-14px_rgba(15,23,42,0.18)]"
              >
                <span
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-display text-base font-black uppercase tracking-wide text-header-bg">
                        {deck.name}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: accent }}
                          aria-hidden
                        />
                        {format?.name ?? deck.formatId}
                      </span>
                      <span className="rounded-full border border-slate-900/10 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {archetype?.name ?? deck.archetypeId}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(deck.id)}
                      aria-label="Modifica mazzo"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900/10 bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-200 hover:text-header-bg"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Modifica</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(deck.id)}
                      aria-label="Elimina mazzo"
                      className="inline-flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pl-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>
                      Main <span className="text-header-bg">{mainCount}</span>/{minSize}
                      {maxSide > 0 && (
                        <span className="ml-2 text-slate-400">
                          Side <span className="text-slate-600">{sideCount}</span>/{maxSide}
                        </span>
                      )}
                    </span>
                    <span className={isLegal ? 'text-emerald-600' : 'text-amber-600'}>{progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: isLegal ? '#34d399' : accent,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
