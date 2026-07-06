'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck, AlertTriangle, Hammer } from 'lucide-react';
import { getFormat } from '@/lib/data/catalog';
import { getDeckArchetype } from '@/lib/data/deck-archetypes';
import { getMainDeckMinSize, getSideboardMaxSize, countCards } from '@/lib/data/deck-utils';
import type { Deck } from '@/types/deck';
import { CreateDeckForm, FORMAT_META } from './create-deck-form';
import type { CreateDeckInput } from '@/lib/validations/deck';

interface DeckListProps {
  decks: Deck[];
  onCreate: (input: CreateDeckInput) => void;
  onEdit: (deckId: string) => void;
  onDelete: (deckId: string) => void;
  isCreating?: boolean;
}

type Status = 'verified' | 'mismatch' | 'legal' | 'building';

const STATUS_META: Record<Status, { label: string; className: string; Icon: typeof ShieldCheck }> = {
  verified: { label: 'Verificato', className: 'bg-emerald-500/20 text-emerald-300', Icon: ShieldCheck },
  mismatch: { label: 'Discrepanza', className: 'bg-red-500/20 text-red-300', Icon: AlertTriangle },
  legal: { label: 'Legale', className: 'bg-emerald-500/20 text-emerald-300', Icon: ShieldCheck },
  building: { label: 'In costruzione', className: 'bg-amber-500/20 text-amber-300', Icon: Hammer },
};

export function DeckList({ decks, onCreate, onEdit, onDelete, isCreating = false }: DeckListProps) {
  const [creating, setCreating] = useState(false);

  const handleCreate = (input: CreateDeckInput) => {
    onCreate(input);
    setCreating(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-black uppercase tracking-wide text-white">
          I miei deck
        </h2>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={isCreating}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-[0_6px_18px_rgba(255,115,0,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Nuovo mazzo
          </button>
        )}
      </div>

      {creating && (
        <div className="rounded-2xl border border-[#FF7300]/25 bg-gradient-to-br from-[#FF7300]/8 to-transparent p-4 sm:p-5">
          <p className="mb-4 font-display text-sm font-black uppercase tracking-wide text-white">
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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF7300]/15 text-[#FF7300]">
            <Hammer className="h-6 w-6" />
          </div>
          <p className="font-display text-base font-black uppercase tracking-wide text-white/85">
            Nessun mazzo
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-white/50">
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
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
              >
                <span
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-display text-base font-black uppercase tracking-wide text-white">
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: accent }}
                          aria-hidden
                        />
                        {format?.name ?? deck.formatId}
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/50">
                        {archetype?.name ?? deck.archetypeId}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(deck.id)}
                      aria-label="Modifica mazzo"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/20"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Modifica</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(deck.id)}
                      aria-label="Elimina mazzo"
                      className="inline-flex items-center justify-center rounded-lg bg-red-500/10 p-2 text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pl-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-white/60">
                    <span>
                      Main <span className="text-white/85">{mainCount}</span>/{minSize}
                      {maxSide > 0 && (
                        <span className="ml-2 text-white/40">
                          Side <span className="text-white/70">{sideCount}</span>/{maxSide}
                        </span>
                      )}
                    </span>
                    <span className={isLegal ? 'text-emerald-300' : 'text-amber-300'}>{progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
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
