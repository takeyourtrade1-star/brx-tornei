'use client';

import { Lock, LogOut, Play, UserPlus, Users } from 'lucide-react';
import { getBuyInLabel } from '@/lib/data/buy-in';
import type { LobbyTable } from '@/lib/lobby';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConnectionQualityBadge } from '../connection-quality-badge';
import { LobbySeat, VersusBadge } from './lobby-seat';

interface TableCardProps {
  table: LobbyTable;
  busy?: boolean;
  createLocked?: boolean;
  onSit: (table: LobbyTable) => void;
  onOpen: (table: LobbyTable) => void;
  onLeave: (table: LobbyTable) => void;
  onGoLive: (table: LobbyTable) => void;
}

export function TableCard({ table, busy, createLocked = false, onSit, onOpen, onLeave, onGoLive }: TableCardProps) {
  const isMine = table.kind === 'mine';
  const seatedCount = table.seats.filter((seat) => seat.occupied).length;
  const price = getBuyInLabel(table.tournament?.buyIn ?? 'for_fun');
  const hostName = table.seats[0].occupied ? table.seats[0].username : null;
  const myConnection = table.seats.find((seat) => seat.occupied && seat.isMe);
  const title = isMine
    ? 'Il tuo tavolo'
    : table.kind === 'joinable' && hostName
      ? `Tavolo di ${hostName}`
      : 'Apri un nuovo tavolo';
  const eyebrow = isMine
    ? 'La tua postazione'
    : table.kind === 'joinable'
      ? 'Sfida aperta'
      : 'Nuovo tavolo';

  const handlePrimary = () => {
    if (busy) return;
    if (table.kind === 'empty' || table.kind === 'joinable') onSit(table);
    else if (table.started) onGoLive(table);
    else onOpen(table);
  };

  if (table.kind === 'empty') {
    const EmptyIcon = createLocked ? Lock : UserPlus;
    return (
      <button
        type="button"
        disabled={busy || createLocked}
        onClick={handlePrimary}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-900/[0.14] bg-white/70 px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 transition',
          createLocked ? 'cursor-not-allowed opacity-70' : 'hover:border-slate-900/25 hover:bg-white hover:text-header-bg',
        )}
      >
        <EmptyIcon className="h-4 w-4" aria-hidden />
        {createLocked ? 'Scegli un formato oppure un tavolo disponibile' : 'Sfida i tuoi amici'}
      </button>
    );
  }

  return (
    <article
      className={cn(
        'group rounded-2xl border bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition sm:px-5 sm:py-4',
        isMine ? 'border-primary/15 ring-1 ring-primary/10' : 'border-slate-900/[0.08] hover:border-slate-900/15 hover:shadow-md',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
          <h3 className="mt-0.5 truncate text-base font-black leading-tight text-header-bg">{title}</h3>
        </div>
        {isMine && (
          <ConnectionQualityBadge connection={myConnection?.occupied ? myConnection.connection : undefined} compact />
        )}
      </header>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 sm:gap-3">
        <LobbySeat
          occupied={table.seats[0].occupied}
          username={table.seats[0].occupied ? table.seats[0].username : null}
          isMe={table.seats[0].occupied && table.seats[0].isMe}
          label="Posto 1"
          compact
          light
        />
        <VersusBadge light compact />
        <LobbySeat
          occupied={table.seats[1].occupied}
          username={table.seats[1].occupied ? table.seats[1].username : null}
          isMe={table.seats[1].occupied && table.seats[1].isMe}
          label="Posto 2"
          compact
          light
        />
      </div>

      <footer className="mt-4 flex items-center justify-between gap-3 border-t border-slate-900/[0.06] pt-3.5">
        <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden /> {seatedCount}/2
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="truncate">{price}</span>
          {table.kind === 'joinable' && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>P2P</span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {table.kind === 'joinable' && (
            <PrimaryButton busy={busy} onClick={handlePrimary}>
              <UserPlus className="h-3.5 w-3.5" aria-hidden /> Siediti
            </PrimaryButton>
          )}
          {isMine && (
            <>
              <PrimaryButton busy={busy} onClick={() => (table.started || table.seats[1].occupied ? onGoLive(table) : onOpen(table))}>
                <Play className="h-3.5 w-3.5" aria-hidden />
                {table.started ? 'Partita' : table.seats[1].occupied ? 'Vai' : 'Apri'}
              </PrimaryButton>
              <LeaveButton busy={busy} onClick={() => onLeave(table)} label={table.started ? 'Abbandona' : 'Alzati'} />
            </>
          )}
        </div>
      </footer>
    </article>
  );
}

function PrimaryButton({ children, busy, onClick }: { children: React.ReactNode; busy?: boolean; onClick: () => void }) {
  return (
    <Button type="button" disabled={busy} onClick={onClick} className="h-9 min-h-9 gap-1.5 px-3.5 text-xs">
      {children}
    </Button>
  );
}

function LeaveButton({ busy, onClick, label }: { busy?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      aria-label={`${label} dal tavolo`}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-900/10 px-3 text-xs font-bold text-slate-500 transition hover:border-red-500/25 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
