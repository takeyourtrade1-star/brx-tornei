'use client';

import { Layers, X } from 'lucide-react';
import type { CreateDeckFormState, DeckZone } from './builder-types';
import { DeckBuilderSidebar } from './deck-builder-sidebar';

interface DeckSidebarDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: CreateDeckFormState;
  activeZone: DeckZone | 'all';
  onRemove: (zone: DeckZone, cardId: string) => void;
  onNameChange: (name: string) => void;
}

export function DeckSidebarDrawer({
  open,
  onOpenChange,
  values,
  activeZone,
  onRemove,
  onNameChange,
}: DeckSidebarDrawerProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="brx-liquid-glass-btn fixed bottom-6 right-4 z-30 flex items-center gap-2 rounded-full px-5 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-white lg:hidden"
      >
        <Layers className="h-4 w-4" />
        Vedi mazzo
      </button>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Chiudi anteprima mazzo"
            onClick={() => onOpenChange(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl border border-white/15 bg-header-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-sans text-sm font-bold uppercase tracking-wide text-white">
                Anteprima mazzo
              </p>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              <DeckBuilderSidebar
                values={values}
                activeZone={activeZone}
                onRemove={onRemove}
                onNameChange={onNameChange}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
