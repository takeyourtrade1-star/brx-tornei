'use client';

import { LogOut, Play, User, UserPlus, Users } from 'lucide-react';
import { getBuyInLabel } from '@/lib/data/buy-in';
import type { LobbyTable, Seat } from '@/lib/lobby';
import { cn } from '@/lib/utils';

interface TableCardProps {
  table: LobbyTable;
  busy?: boolean;
  onSit: (table: LobbyTable) => void;
  onOpen: (table: LobbyTable) => void;
  onLeave: (table: LobbyTable) => void;
  onGoLive: (table: LobbyTable) => void;
}

export function TableCard({ table, busy, onSit, onOpen, onLeave, onGoLive }: TableCardProps) {
  const isMine = table.kind === 'mine';
  const participantCount = table.tournament?.participants.length ?? 0;
  const maxPlayers = table.tournament?.maxPlayers ?? 2;
  const price = getBuyInLabel(table.tournament?.buyIn ?? 'for_fun');

  const handlePrimary = () => {
    if (busy) return;
    if (table.kind === 'empty' || table.kind === 'joinable') onSit(table);
    else if (table.started) onGoLive(table);
    else onOpen(table);
  };

  return (
    <article
      className={cn(
        'grid gap-4 rounded-2xl border p-4 text-white transition lg:grid-cols-[minmax(17rem,2fr)_minmax(6rem,0.65fr)_minmax(7rem,0.7fr)_minmax(8rem,0.8fr)_auto] lg:items-center',
        isMine
          ? 'border-primary/60 bg-header-bg ring-1 ring-primary/30'
          : 'border-white/10 bg-header-bg/95 hover:border-white/25 hover:bg-header-bg',
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <SeatChip seat={table.seats[0]} />
          <span className="text-xs font-black uppercase tracking-wider text-white/35">vs</span>
          <SeatChip seat={table.seats[1]} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {table.tournament?.withFriend && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-extrabold text-primary">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Tavolo amici
            </span>
          )}
          {isMine && (
            <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-extrabold text-primary">
              {table.started
                ? 'Partita pronta'
                : table.seats[1].occupied
                  ? 'Ready check'
                  : 'Sei seduto qui'}
            </span>
          )}
        </div>
      </div>

      <TableDatum label="Prezzi" value={price} emphasized />
      <TableDatum label="Numero giocatori" value={`${participantCount}/${maxPlayers}`} />
      <TableDatum label="Tipo di gioco" value="Solo buy-in" />

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {(table.kind === 'empty' || table.kind === 'joinable') && (
          <PrimaryButton busy={busy} onClick={handlePrimary}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Siediti
          </PrimaryButton>
        )}

        {isMine && !table.started && (
          <>
            {table.seats[1].occupied ? (
              <PrimaryButton busy={busy} onClick={() => onGoLive(table)}>
                <Play className="h-4 w-4" aria-hidden="true" />
                Vai al tavolo
              </PrimaryButton>
            ) : (
              <SecondaryButton busy={busy} onClick={() => onOpen(table)} label="Apri" />
            )}
            <LeaveButton busy={busy} onClick={() => onLeave(table)} label="Alzati" />
          </>
        )}

        {isMine && table.started && (
          <>
            <PrimaryButton busy={busy} onClick={() => onGoLive(table)}>
              <Play className="h-4 w-4" aria-hidden="true" />
              Vai alla partita
            </PrimaryButton>
            <LeaveButton busy={busy} onClick={() => onLeave(table)} label="Abbandona" />
          </>
        )}
      </div>
    </article>
  );
}

function TableDatum({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
      <span className="block text-xs font-bold text-white/40 lg:sr-only">{label}</span>
      <span className={cn('mt-0.5 block text-sm font-extrabold lg:mt-0', emphasized ? 'text-primary' : 'text-white')}>
        {value}
      </span>
    </div>
  );
}

function SeatChip({ seat }: { seat: Seat }) {
  if (!seat.occupied) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-white/15 bg-white/[0.02] px-3 py-1.5 text-sm font-medium text-white/40">
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Posto libero
      </span>
    );
  }
  return (
    <span className={cn(
      'inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold',
      seat.isMe ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white',
    )}>
      <User className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{seat.username}</span>
      {seat.isMe && <span className="text-xs font-extrabold text-primary/80">tu</span>}
    </span>
  );
}

function PrimaryButton({ children, busy, onClick }: { children: React.ReactNode; busy?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-2.5 text-xs font-black text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ busy, onClick, label }: { busy?: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" disabled={busy} onClick={onClick} className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/85 transition hover:bg-white/10 disabled:opacity-50">
      {label}
    </button>
  );
}

function LeaveButton({ busy, onClick, label }: { busy?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      aria-label={label === 'Alzati' ? 'Alzati dal tavolo' : 'Abbandona la partita'}
      className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/15 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-destructive/25 disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
