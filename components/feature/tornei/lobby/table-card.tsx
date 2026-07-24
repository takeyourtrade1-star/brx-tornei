'use client';

import {
  BadgeEuro,
  Gamepad2,
  LogOut,
  Play,
  User,
  UserPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
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
  const seatedCount = table.seats.filter((seat) => seat.occupied).length;
  const maxPlayers = table.tournament?.maxPlayers ?? 2;
  const price = getBuyInLabel(table.tournament?.buyIn ?? 'for_fun');
  const gameType = price === 'For Fun' ? 'Partita libera' : 'Solo buy-in';

  const handlePrimary = () => {
    if (busy) return;
    if (table.kind === 'empty' || table.kind === 'joinable') onSit(table);
    else if (table.started) onGoLive(table);
    else onOpen(table);
  };

  return (
    <article
      className={cn(
        'relative isolate grid gap-4 overflow-hidden rounded-[1.65rem] border bg-gradient-to-br from-stone-900 via-stone-950 to-zinc-950 p-4 text-white shadow-xl shadow-black/20 transition duration-200',
        'lg:min-h-[5.5rem] lg:grid-cols-[minmax(15rem,2fr)_minmax(6.5rem,0.65fr)_minmax(8rem,0.75fr)_minmax(8rem,0.8fr)_minmax(12.5rem,1fr)] lg:items-center lg:px-4 lg:py-3',
        isMine
          ? 'border-primary/40 ring-1 ring-primary/15'
          : 'border-white/10 hover:-translate-y-0.5 hover:border-white/25 hover:from-stone-800',
      )}
    >
      {isMine && (
        <>
          <span className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-primary" aria-hidden="true" />
          <span className="pointer-events-none absolute -left-16 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        </>
      )}

      <div className="relative min-w-0 lg:pl-1">
        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.17em] text-white/45">
          {isMine ? 'Il tuo tavolo' : seatedCount > 0 ? 'Sfida aperta' : 'Tavolo disponibile'}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <SeatChip seat={table.seats[0]} />
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-black/25 text-[9px] font-black uppercase tracking-wider text-white/45">
            vs
          </span>
          <SeatChip seat={table.seats[1]} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {table.tournament?.withFriend && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-marquee/25 bg-marquee/10 px-2.5 py-1 text-[10px] font-extrabold text-marquee">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Tavolo amici
            </span>
          )}
          {isMine && (
            <TableStateBadge started={table.started} opponentSeated={table.seats[1].occupied} />
          )}
        </div>
      </div>

      <TableDatum icon={BadgeEuro} label="Prezzo" value={price} />
      <TableDatum icon={UsersRound} label="Giocatori seduti" value={`${seatedCount}/${maxPlayers}`} />
      <TableDatum icon={Gamepad2} label="Tipo di gioco" value={gameType} />

      <div className="relative flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
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

function TableStateBadge({
  started,
  opponentSeated,
}: {
  started: boolean;
  opponentSeated: boolean;
}) {
  if (started) {
    return (
      <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-extrabold text-emerald-200">
        Partita pronta
      </span>
    );
  }
  if (opponentSeated) {
    return (
      <span className="rounded-full bg-marquee/10 px-2.5 py-1 text-[10px] font-extrabold text-marquee">
        Ready check
      </span>
    );
  }
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-extrabold text-white/70">
      Sei seduto qui
    </span>
  );
}

function TableDatum({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="relative flex min-w-0 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/60">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-white/40 lg:sr-only">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-sm font-black text-white lg:mt-0">{value}</span>
      </span>
    </div>
  );
}

function SeatChip({ seat }: { seat: Seat }) {
  if (!seat.occupied) {
    return (
      <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-dashed border-white/15 bg-white/[0.025] px-2.5 py-1.5 text-xs font-semibold text-white/45">
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Posto libero
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] py-1.5 pl-2.5 pr-1.5 text-xs font-bold text-white">
      <span className={cn('h-2 w-2 shrink-0 rounded-full', seat.isMe ? 'bg-primary' : 'bg-emerald-400')} />
      <User className="h-3.5 w-3.5 shrink-0 text-white/55" aria-hidden="true" />
      <span className="truncate">{seat.username}</span>
      {seat.isMe && (
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-primary">
          tu
        </span>
      )}
    </span>
  );
}

function PrimaryButton({ children, busy, onClick }: { children: React.ReactNode; busy?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-primary/15 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ busy, onClick, label }: { busy?: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" disabled={busy} onClick={onClick} className="min-h-10 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2.5 text-xs font-bold text-white/85 transition hover:bg-white/10 disabled:opacity-50">
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
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/15 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-destructive/25 disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
