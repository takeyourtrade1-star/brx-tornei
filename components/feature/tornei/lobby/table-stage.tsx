'use client';

import { User, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TableSeatInfo {
  occupied: boolean;
  username?: string | null;
  isMe?: boolean;
  label: string;
}

interface TableStageProps {
  far: TableSeatInfo;
  near: TableSeatInfo;
  tone: 'empty' | 'open' | 'mine' | 'live';
  /** Feltro 3D ridotto, senza gettoni giocatore — tavolo libero. */
  compact?: boolean;
}

/** Tavolo TCG in prospettiva: feltro, spessore e giocatori ai due capi. */
export function TableStage({ far, near, tone, compact = false }: TableStageProps) {
  if (compact) {
    return (
      <div className="table-stage table-stage--mini relative mx-auto shrink-0 sm:mx-0">
        <div className={cn('table-3d table-3d--mini', `table-3d--${tone}`)}>
          <div className="table-3d-felt" aria-hidden />
          <span className="table-3d-invite" aria-hidden>
            <UserPlus className="h-4 w-4" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="table-stage relative mx-auto w-full max-w-md">
      <TablePlayerToken seat={far} align="far" />

      <div className={cn('table-3d', `table-3d--${tone}`)}>
        <span className="table-3d-glow" aria-hidden />
        <div className="table-3d-rail" aria-hidden />
        <div className="table-3d-felt" aria-hidden>
          <span className="table-3d-card table-3d-card--l" />
          <span className="table-3d-card table-3d-card--r" />
        </div>
        <span className="table-3d-vs">vs</span>
      </div>

      <TablePlayerToken seat={near} align="near" />
    </div>
  );
}

function TablePlayerToken({
  seat,
  align,
}: {
  seat: TableSeatInfo;
  align: 'far' | 'near';
}) {
  const name = seat.occupied ? (seat.username ?? 'Duellante') : 'Posto libero';
  const clickable = Boolean(seat.occupied && seat.username && !seat.isMe);

  const openProfile = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!clickable || !seat.username) return;
    window.dispatchEvent(
      new CustomEvent('ebartex-open-player-profile', { detail: { gamertag: seat.username } }),
    );
  };

  return (
    <div
      className={cn(
        'relative z-10 flex justify-center',
        align === 'far' ? '-mb-1' : '-mt-1',
      )}
    >
      <button
        type="button"
        disabled={!clickable}
        onClick={openProfile}
        title={clickable ? `Vedi profilo di ${seat.username}` : undefined}
        className={cn(
          'relative flex min-w-0 max-w-[85%] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left shadow-lg shadow-black/30 backdrop-blur-md transition',
          seat.occupied
            ? seat.isMe
              ? 'border-primary/40 bg-primary/15 ring-1 ring-primary/25'
              : 'border-white/15 bg-slate-950/80 hover:border-white/30'
            : 'border-dashed border-white/25 bg-black/25',
          // Ingresso a seduta: il gettone arriva dal suo lato del banco
          // con anello luminoso all'atterraggio (vedi globals.css).
          seat.occupied && (align === 'far' ? 'table-sit-far' : 'table-sit-near'),
          seat.occupied && 'table-sit-chip',
          clickable && 'cursor-pointer hover:border-primary/40',
          !clickable && 'pointer-events-none cursor-default',
        )}
      >
        <span
          className={cn(
            'grid h-7 w-7 shrink-0 place-items-center rounded-lg border',
            seat.occupied
              ? seat.isMe
                ? 'border-primary/35 bg-primary/20 text-primary'
                : 'border-white/15 bg-white/10 text-white'
              : 'border-dashed border-white/20 bg-white/5 text-white/40',
          )}
        >
          {seat.occupied ? (
            <User className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[8px] font-black uppercase tracking-[0.14em] text-white/45">
            {seat.label}
          </span>
          <span
            className={cn(
              'block truncate text-xs font-black leading-snug',
              seat.occupied ? 'text-white' : 'text-white/55',
            )}
          >
            {name}
          </span>
        </span>
        {seat.isMe && (
          <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-primary">
            Tu
          </span>
        )}
      </button>
    </div>
  );
}
