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

/** Tavolo libero: striscia tratteggiata, non una card piena come gli occupati. */
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
        'arena-table-card group flex cursor-pointer flex-col items-stretch gap-2.5 rounded-2xl border-2 border-dashed border-white/25 bg-white/[0.02] px-3 py-2 backdrop-blur-sm transition',
        'hover:border-primary/55 hover:bg-primary/[0.05] active:scale-[0.995] sm:flex-row sm:items-center sm:gap-3.5 sm:px-4',
        busy && 'cursor-not-allowed opacity-60',
      )}
    >
      <TableStage
        far={{ occupied: false, label: 'Giocatore 1' }}
        near={{ occupied: false, label: 'Giocatore 2' }}
        tone="empty"
        compact
      />

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Tavolo libero</p>
        <h3 className="truncate font-display text-sm font-black leading-snug text-white sm:text-base">
          Siediti e apri una sfida
        </h3>
      </div>

      <span
        aria-hidden
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-center rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 text-xs font-black text-white shadow-sm sm:self-auto"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Siediti
      </span>
    </article>
  );
}
