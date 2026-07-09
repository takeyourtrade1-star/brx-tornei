'use client';

import { LogOut, Play, User, UserPlus } from 'lucide-react';
import type { LobbyTable, Seat } from '@/lib/lobby';
import { cn } from '@/lib/utils';

interface TableCardProps {
  table: LobbyTable;
  busy?: boolean;
  /** Siediti a un tavolo vuoto o altrui. */
  onSit: (table: LobbyTable) => void;
  /** Riapri il modale del mio tavolo. */
  onOpen: (table: LobbyTable) => void;
  /** Alzati dal mio tavolo. */
  onLeave: (table: LobbyTable) => void;
  /** Vai alla partita (mio tavolo con match iniziato). */
  onGoLive: (table: LobbyTable) => void;
}

export function TableCard({ table, busy, onSit, onOpen, onLeave, onGoLive }: TableCardProps) {
  const isMine = table.kind === 'mine';

  const handlePrimary = () => {
    if (busy) return;
    if (table.kind === 'empty' || table.kind === 'joinable') onSit(table);
    else if (table.started) onGoLive(table);
    else onOpen(table);
  };

  return (
    <div
      onDoubleClick={handlePrimary}
      className={cn(
        'flex flex-col gap-3 rounded-2xl border p-4 text-white shadow-[0_10px_30px_-16px_rgba(0,0,0,0.6)] transition sm:flex-row sm:items-center sm:justify-between',
        isMine
          ? 'border-primary/60 bg-header-bg shadow-[inset_0_0_0_1px_rgba(255,115,0,0.35)]'
          : 'border-white/10 bg-header-bg/95 hover:border-white/25',
      )}
    >
      <div className="flex items-center gap-3">
        <SeatChip seat={table.seats[0]} />
        <span className="text-[10px] font-black uppercase tracking-wider text-white/40">vs</span>
        <SeatChip seat={table.seats[1]} />
      </div>

      <div className="flex items-center gap-2">
        {isMine && (
          <span className="mr-1 rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
            {table.started ? 'Partita pronta' : 'Sei seduto qui'}
          </span>
        )}

        {table.kind === 'empty' && (
          <PrimaryButton busy={busy} onClick={handlePrimary}>
            <UserPlus className="h-4 w-4" />
            Siediti
          </PrimaryButton>
        )}

        {table.kind === 'joinable' && (
          <PrimaryButton busy={busy} onClick={handlePrimary}>
            <UserPlus className="h-4 w-4" />
            Siediti
          </PrimaryButton>
        )}

        {isMine && !table.started && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => onOpen(table)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/85 transition hover:bg-white/10 disabled:opacity-50"
            >
              Apri
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onLeave(table)}
              aria-label="Alzati dal tavolo"
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Alzati
            </button>
          </>
        )}

        {isMine && table.started && (
          <>
            <PrimaryButton busy={busy} onClick={() => onGoLive(table)}>
              <Play className="h-4 w-4" />
              Vai alla partita
            </PrimaryButton>
            <button
              type="button"
              disabled={busy}
              onClick={() => onLeave(table)}
              aria-label="Abbandona la partita"
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Abbandona
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SeatChip({ seat }: { seat: Seat }) {
  if (!seat.occupied) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-white/15 bg-white/[0.02] px-3 py-1.5 text-sm text-white/35">
        <UserPlus className="h-4 w-4" />
        Posto libero
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold',
        seat.isMe ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white',
      )}
    >
      <User className="h-4 w-4" />
      {seat.username}
      {seat.isMe && <span className="text-[10px] uppercase tracking-wider text-primary/80">tu</span>}
    </span>
  );
}

function PrimaryButton({
  children,
  busy,
  onClick,
}: {
  children: React.ReactNode;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[0_8px_20px_-8px_rgba(255,115,0,0.6)] transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
