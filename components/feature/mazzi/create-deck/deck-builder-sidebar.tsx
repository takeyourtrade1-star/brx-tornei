'use client';

import { AlertTriangle } from 'lucide-react';
import { getMinMainDeckSize, SIDEBOARD_SIZE, countDeckCards } from '@/lib/validations/deck';
import type { CreateDeckFormState, DeckZone } from './builder-types';
import { DeckCardList } from './deck-card-list';

interface DeckBuilderSidebarProps {
  values: CreateDeckFormState;
  activeZone: DeckZone | 'all';
  onRemove: (zone: DeckZone, cardId: string) => void;
  onNameChange?: (name: string) => void;
}

export function DeckBuilderSidebar({
  values,
  activeZone,
  onRemove,
  onNameChange,
}: DeckBuilderSidebarProps) {
  const minMain = getMinMainDeckSize(values.format);
  const mainCount = countDeckCards(values.main);
  const sideCount = countDeckCards(values.sideboard);
  const mainBelowMin = mainCount < minMain;
  const sideIncomplete = sideCount !== SIDEBOARD_SIZE;

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/15 brx-glass">
      <div className="border-b border-white/10 px-4 py-3">
        <label htmlFor="deck-name-sidebar" className="font-sans text-xs font-bold uppercase tracking-wider text-white/50">
          Nome mazzo
        </label>
        <input
          id="deck-name-sidebar"
          type="text"
          value={values.name}
          onChange={(event) => onNameChange?.(event.target.value)}
          placeholder="Senza nome"
          maxLength={80}
          className="mt-1 w-full truncate rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 font-display text-base font-bold text-white placeholder:text-white/30 focus:border-marquee/50 focus:outline-none focus:ring-1 focus:ring-marquee/30"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <section
          className={`flex min-h-0 flex-1 flex-col border-b border-white/10 ${
            activeZone === 'main' ? 'bg-marquee/5' : ''
          }`}
        >
          <header className="flex items-center justify-between px-4 py-2">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-white/70">
              Main deck
            </h3>
            <span
              className={`font-mono text-sm font-bold ${
                mainBelowMin ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {mainCount}/{minMain}
            </span>
          </header>
          {mainBelowMin && (
            <p className="flex items-center gap-1.5 px-4 pb-2 text-xs text-amber-300/90">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Mancano {minMain - mainCount} carte
            </p>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            <DeckCardList
              entries={values.main}
              emptyLabel="Nessuna carta nel main"
              onRemove={(cardId) => onRemove('main', cardId)}
            />
          </div>
        </section>

        <section
          className={`flex min-h-0 flex-1 flex-col ${
            activeZone === 'sideboard' ? 'bg-marquee/5' : ''
          }`}
        >
          <header className="flex items-center justify-between px-4 py-2">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-white/70">
              Sideboard
            </h3>
            <span
              className={`font-mono text-sm font-bold ${
                sideIncomplete ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {sideCount}/{SIDEBOARD_SIZE}
            </span>
          </header>
          {sideIncomplete && (
            <p className="flex items-center gap-1.5 px-4 pb-2 text-xs text-amber-300/90">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {sideCount < SIDEBOARD_SIZE
                ? `Mancano ${SIDEBOARD_SIZE - sideCount} carte`
                : `${sideCount - SIDEBOARD_SIZE} carte in eccesso`}
            </p>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            <DeckCardList
              entries={values.sideboard}
              emptyLabel="Nessuna carta nel side"
              onRemove={(cardId) => onRemove('sideboard', cardId)}
            />
          </div>
        </section>
      </div>
    </aside>
  );
}
