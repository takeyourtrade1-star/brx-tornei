'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Layers, MonitorUp, X } from 'lucide-react';
import { DeckWorkspace } from '@/components/feature/decks/deck-workspace';
import type { LobbyTable } from '@/lib/lobby';
import type { Deck } from '@/types/deck';
import { TableCard } from './table-card';

export type ArcadeOfficialSurface = 'tournaments' | 'decks';

interface ArcadeOfficialModalProps {
  surface: ArcadeOfficialSurface | null;
  onClose: () => void;
  tables: LobbyTable[];
  initialDecks: Deck[];
  formatName: string;
  modeName: string;
  busy: boolean;
  error: string | null;
  createLocked: boolean;
  onSit: (table: LobbyTable) => void;
  onOpen: (table: LobbyTable) => void;
  onLeave: (table: LobbyTable) => void;
  onGoLive: (table: LobbyTable) => void;
}
export function ArcadeOfficialModal({
  surface,
  onClose,
  tables,
  initialDecks,
  formatName,
  modeName,
  busy,
  error,
  createLocked,
  onSit,
  onOpen,
  onLeave,
  onGoLive,
}: ArcadeOfficialModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!surface) return undefined;
    const timer = window.setTimeout(() => closeRef.current?.focus(), 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || busy) return;
      event.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, [busy, onClose, surface]);

  if (!surface) return null;
  const tournaments = surface === 'tournaments';
  const title = tournaments ? 'Tornei live' : 'Monta il tuo mazzo';
  const Icon = tournaments ? MonitorUp : Layers;

  return createPortal(
    <div className="fixed inset-0 z-[900] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={busy}
        onClick={onClose}
        className="absolute inset-0 bg-header-bg/85 backdrop-blur-md"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="arcade-official-title"
        data-arcade-official-surface={surface}
        className="relative flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-header-bg text-white shadow-2xl sm:max-h-[90dvh] sm:rounded-[2rem]"
      >
        <div className="h-1 shrink-0 bg-gradient-global" aria-hidden="true" />
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Vista ufficiale Ebartex
              </p>
              <h2 id="arcade-official-title" className="truncate font-display text-xl font-black tracking-tight">
                {title}
              </h2>
              {tournaments ? (
                <p className="mt-0.5 text-xs font-semibold text-white/50">
                  {formatName} · {modeName} · dati live della lobby
                </p>
              ) : null}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Chiudi vista ufficiale"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-white/25 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {tournaments ? (
            <div className="space-y-4">
              {error ? (
                <p role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-200">
                  {error}
                </p>
              ) : null}
              {tables.map((table) => (
                <TableCard
                  key={table.key}
                  table={table}
                  busy={busy}
                  createLocked={createLocked}
                  onSit={onSit}
                  onOpen={onOpen}
                  onLeave={onLeave}
                  onGoLive={onGoLive}
                />
              ))}
            </div>
          ) : (
            <DeckWorkspace initialDecks={initialDecks} />
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
