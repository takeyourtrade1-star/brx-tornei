'use client';

import { LogOut, Settings2, Swords, UserPlus } from 'lucide-react';
import { getBuyInLabel } from '@/lib/data/buy-in';
import type { BestOf } from '@/types/tournament';
import type { LobbyTable, Seat } from '@/lib/lobby';
import { cn } from '@/lib/utils';
import { ConnectionQualityBadge } from '../connection-quality-badge';
import { EmptyTableCard } from './empty-table-card';
import { TableMetaChips } from './table-meta-chips';
import { TableStage, type TableSeatInfo } from './table-stage';

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
  if (table.kind === 'empty') {
    return <EmptyTableCard table={table} busy={busy} createLocked={createLocked} onSit={onSit} />;
  }

  const isMine = table.kind === 'mine';
  const seatedCount = table.seats.filter((seat) => seat.occupied).length;
  const price = getBuyInLabel(table.tournament?.buyIn ?? 'for_fun');
  const bestOf: BestOf = table.tournament?.bestOf ?? 'BO3';
  const hostName = table.seats[0].occupied ? table.seats[0].username : null;
  const opponentSeat = table.seats.find((seat) => seat.occupied && !seat.isMe);
  const opponentName = opponentSeat?.occupied ? opponentSeat.username : null;
  const myConnection = table.seats.find((seat) => seat.occupied && seat.isMe);

  let eyebrow: string;
  let title: string;
  let statusBadge: { label: string; style: string } | null = null;
  let tone: 'open' | 'mine' | 'live' = 'open';
  let actionLabel: string;
  let actionIcon: typeof UserPlus;

  if (isMine) {
    if (table.started) {
      eyebrow = 'PARTITA LIVE';
      title = opponentName ? `Sfida vs ${opponentName}` : 'Partita in corso';
      statusBadge = { label: 'In corso', style: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' };
      tone = 'live';
      actionLabel = 'Partita';
      actionIcon = Swords;
    } else if (opponentName) {
      eyebrow = 'SFIDA PRONTA';
      title = `Sfida vs ${opponentName}`;
      statusBadge = { label: 'Sfidante pronto', style: 'border-amber-400/30 bg-amber-500/15 text-amber-300' };
      tone = 'mine';
      actionLabel = 'Gestisci tavolo';
      actionIcon = Settings2;
    } else {
      eyebrow = 'IL TUO TAVOLO';
      title = 'In attesa di sfidante';
      statusBadge = { label: 'Aperto', style: 'border-primary/30 bg-primary/15 text-primary' };
      tone = 'mine';
      actionLabel = 'Gestisci tavolo';
      actionIcon = Settings2;
    }
  } else {
    eyebrow = 'SFIDA APERTA';
    title = hostName ? `Tavolo di ${hostName}` : 'Tavolo disponibile';
    statusBadge = { label: 'Disponibile', style: 'border-sky-400/30 bg-sky-500/15 text-sky-300' };
    actionLabel = 'Siediti';
    actionIcon = UserPlus;
  }

  const { far, near } = seatsForStage(table);
  const ActionIcon = actionIcon;

  const handlePrimary = () => {
    if (busy) return;
    if (table.kind === 'joinable') onSit(table);
    else if (table.started) onGoLive(table);
    else onOpen(table);
  };

  const onCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePrimary();
    }
  };

  return (
    <article
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-label={actionLabel}
      aria-disabled={busy || undefined}
      onClick={handlePrimary}
      onKeyDown={onCardKeyDown}
      className={cn(
        'arena-panel arena-table-card group cursor-pointer p-4 transition hover:border-white/25 active:scale-[0.995] sm:p-5',
        isMine && 'ring-1 ring-primary/25 hover:border-primary/40',
        busy && 'cursor-not-allowed opacity-60',
      )}
    >
      {isMine && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF7300] via-amber-500 to-[#e0564d]"
        />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-marquee/35 to-transparent"
      />

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h3 className="mt-0.5 truncate font-display text-base font-black leading-snug text-white sm:text-lg">
            {title}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {statusBadge && (
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider',
                statusBadge.style,
              )}
            >
              {statusBadge.label}
            </span>
          )}
          {isMine && (
            <ConnectionQualityBadge
              connection={myConnection?.occupied ? myConnection.connection : undefined}
              compact
              dark
            />
          )}
        </div>
      </header>

      <div className="mt-4">
        <TableStage far={far} near={near} tone={tone} />
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-[38px] min-h-[2.375rem] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 text-xs font-black text-white shadow-sm"
          >
            <ActionIcon className="h-4 w-4" />
            {actionLabel}
          </span>
          {isMine && (
            <LeaveButton busy={busy} onClick={() => onLeave(table)} label={table.started ? 'Abbandona' : 'Alzati'} />
          )}
        </div>

        <TableMetaChips seatedCount={seatedCount} bestOf={bestOf} price={price} />
      </footer>
    </article>
  );
}

function seatsForStage(table: LobbyTable): {
  far: TableSeatInfo;
  near: TableSeatInfo;
} {
  const seat0 = toSeatInfo(table.seats[0], 'Giocatore 1');
  const seat1 = toSeatInfo(table.seats[1], 'Giocatore 2');
  if (seat1.isMe) return { far: seat0, near: seat1 };
  if (seat0.isMe) return { far: seat1, near: seat0 };
  return { far: seat0, near: seat1 };
}

function toSeatInfo(seat: Seat, label: string): TableSeatInfo {
  if (!seat.occupied) return { occupied: false, label };
  return { occupied: true, username: seat.username, isMe: seat.isMe, label };
}

function LeaveButton({ busy, onClick, label }: { busy?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={`${label} dal tavolo`}
      className="inline-flex h-[38px] min-h-[2.375rem] items-center gap-1.5 rounded-xl border border-red-400/25 bg-red-500/10 px-3.5 text-xs font-bold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20 disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
