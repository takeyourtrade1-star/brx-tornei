'use client';

import { UserPlus } from 'lucide-react';
import type { LobbyTable } from '@/lib/lobby';
import { cn } from '@/lib/utils';
import { TableStage } from './table-stage';

interface EmptyTableCardProps {
  table: LobbyTable;
  busy?: boolean;
  createLocked?: boolean;
  onSit: (table: LobbyTable) => void;
}

/** Tavolo libero: stesso feltro 3D, card compatta, senza posti. */
export function EmptyTableCard({ table, busy, createLocked = false, onSit }: EmptyTableCardProps) {
  if (createLocked) {
    return (
      <p
        role="note"
        className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 backdrop-blur-sm"
      >
        Aggiungiti a un tavolo già aperto, oppure scegli un formato in alto per aprirne uno nuovo.
      </p>
    );
  }

  const sit = () => {
    if (!busy) onSit(table);
  };

  return (
    <article
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-label="Siediti e apri una sfida"
      aria-disabled={busy || undefined}
      onClick={sit}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          sit();
        }
      }}
      className={cn(
        'arena-panel arena-table-card group cursor-pointer border-dashed border-primary/40 px-4 py-3 transition hover:border-primary/70 hover:bg-primary/5 active:scale-[0.995] sm:px-5',
        busy && 'cursor-not-allowed opacity-60',
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Tavolo libero</p>
          <h3 className="truncate font-display text-sm font-black leading-snug text-white sm:text-base">
            Siediti e apri una sfida
          </h3>
        </div>
        <span className="rounded-full border border-dashed border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
          Vuoto
        </span>
      </header>

      <div className="mt-2">
        <TableStage
          far={{ occupied: false, label: 'Giocatore 1' }}
          near={{ occupied: false, label: 'Giocatore 2' }}
          tone="empty"
          compact
        />
      </div>

      <div className="mt-1 flex justify-center">
        <span
          aria-hidden
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 text-xs font-black text-white shadow-sm"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Siediti
        </span>
      </div>
    </article>
  );
}
