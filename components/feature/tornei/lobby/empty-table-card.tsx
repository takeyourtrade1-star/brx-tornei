'use client';

import { UserPlus } from 'lucide-react';
import type { LobbyTable } from '@/lib/lobby';
import { cn } from '@/lib/utils';

interface EmptyTableCardProps {
  table: LobbyTable;
  busy?: boolean;
  createLocked?: boolean;
  onSit: (table: LobbyTable) => void;
}

/** Tavolo libero: striscia compatta, visivamente diversa dai tavoli occupati. */
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
        'arena-panel arena-table-card group flex cursor-pointer items-center gap-3 border-dashed border-primary/40 px-3.5 py-2.5 sm:gap-4 sm:px-4',
        'transition hover:border-primary/70 hover:bg-primary/5 active:scale-[0.995]',
        busy && 'cursor-not-allowed opacity-60',
      )}
    >
      <div className="table-stage table-stage--mini" aria-hidden>
        <div className="table-3d table-3d--mini table-3d--empty">
          <div className="table-3d-felt" />
          <span className="table-3d-invite">
            <UserPlus className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Tavolo libero</p>
        <h3 className="truncate font-display text-sm font-black leading-snug text-white sm:text-base">
          Siediti e apri una sfida
        </h3>
      </div>

      <span
        aria-hidden
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-3.5 text-xs font-black text-white shadow-sm"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Siediti
      </span>
    </article>
  );
}
