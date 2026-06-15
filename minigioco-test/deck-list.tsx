'use client';

import { useState } from 'react';
import { getFormat } from '@/lib/data/catalog';
import { getDeckArchetype } from '@/lib/data/deck-archetypes';
import { getMainDeckMinSize, getSideboardMaxSize, countCards } from '@/lib/data/deck-utils';
import type { Deck } from '@/types/deck';
import { CreateDeckForm } from './create-deck-form';
import type { CreateDeckInput } from '@/lib/validations/deck';

interface DeckListProps {
  decks: Deck[];
  onCreate: (input: CreateDeckInput) => Deck;
  onEdit: (deckId: string) => void;
  onDelete: (deckId: string) => void;
}

export function DeckList({ decks, onCreate, onEdit, onDelete }: DeckListProps) {
  const [creating, setCreating] = useState(false);

  const handleCreate = (input: CreateDeckInput) => {
    const deck = onCreate(input);
    setCreating(false);
    onEdit(deck.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-black uppercase tracking-wide text-white">
          I miei deck
        </h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg transition-transform active:scale-[0.98]"
        >
          + Nuovo mazzo
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <CreateDeckForm
            onCreate={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {decks.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm font-bold text-white/80">Nessun mazzo</p>
          <p className="mt-1 text-xs text-white/50">
            Crea il tuo primo mazzo usando le carte del tuo inventario.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {decks.map((deck) => {
            const format = getFormat(deck.formatId);
            const archetype = getDeckArchetype(deck.archetypeId);
            const mainCount = countCards(deck.main);
            const sideCount = countCards(deck.side);
            const minSize = getMainDeckMinSize(deck.formatId);
            const maxSide = getSideboardMaxSize(deck.formatId);
            const isLegal = mainCount >= minSize && sideCount <= maxSide;

            return (
              <div
                key={deck.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/[0.07]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">{deck.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        isLegal
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {isLegal ? 'Legale' : 'In costruzione'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/50">
                    {format?.name ?? deck.formatId} · {archetype?.name ?? deck.archetypeId}
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    {mainCount}/{minSize} main
                    {maxSide > 0 && ` · ${sideCount}/${maxSide} sideboard`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(deck.id)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/20"
                  >
                    Modifica
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(deck.id)}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-300 transition-colors hover:bg-red-500/20"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
