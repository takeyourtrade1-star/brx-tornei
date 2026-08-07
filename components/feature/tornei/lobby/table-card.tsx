'use client';

import {
  LogOut,
  Play,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { getBuyInLabel } from '@/lib/data/buy-in';
import type { LobbyTable } from '@/lib/lobby';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LobbySeat, VersusBadge } from './lobby-seat';

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
  const hostName = table.seats[0].occupied ? table.seats[0].username : null;

  const title = isMine
    ? 'Il tuo tavolo'
    : table.kind === 'joinable' && hostName
      ? `Tavolo di ${hostName}`
      : 'Apri un nuovo tavolo';

  const subtitle = table.started
    ? 'Partita pronta per iniziare'
    : seatedCount > 0
      ? 'In attesa del secondo giocatore'
      : 'Siediti per creare una nuova sfida';

  const handlePrimary = () => {
    if (busy) return;
    if (table.kind === 'empty' || table.kind === 'joinable') onSit(table);
    else if (table.started) onGoLive(table);
    else onOpen(table);
  };

  // Tavolo vuoto → look "apri nuovo": più basso, bordo tratteggiato, tono invito.
  if (table.kind === 'empty') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={handlePrimary}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-900/[0.14] bg-white/70 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-900/25 hover:bg-white hover:text-header-bg hover:shadow-[0_12px_28px_-16px_rgba(15,23,42,0.2)] motion-reduce:hover:translate-y-0"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        {title}
      </button>
    );
  }

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-white transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.25)]',
        isMine
          ? 'border-header-bg/15 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-header-bg/10'
          : 'border-slate-900/[0.08] shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-header-bg/20',
      )}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-400">
            {isMine ? 'La tua postazione' : seatedCount > 0 ? 'Sfida aperta' : 'Tavolo disponibile'}
          </p>
          <h3 className="mt-1 flex items-center gap-2 truncate text-base font-black text-header-bg sm:text-lg">
            {title}
            {isMine && (
              <span className="rounded-full bg-header-bg/[0.07] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-header-bg/80">
                Tu
              </span>
            )}
          </h3>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{subtitle}</p>
        </div>
        {table.tournament?.withFriend && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-900/[0.08] bg-slate-50 px-3 py-1.5 text-[10px] font-extrabold text-slate-600">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Amici
          </span>
        )}
      </header>

      <div className="mt-3 flex items-center gap-4 px-5 sm:px-6">
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <LobbySeat
            occupied={table.seats[0].occupied}
            username={table.seats[0].occupied ? table.seats[0].username : null}
            isMe={table.seats[0].occupied && table.seats[0].isMe}
            label={table.seats[0].occupied && table.seats[0].isMe ? 'Il tuo posto' : 'Posto 1'}
            light
          />
          <VersusBadge light />
          <LobbySeat
            occupied={table.seats[1].occupied}
            username={table.seats[1].occupied ? table.seats[1].username : null}
            isMe={table.seats[1].occupied && table.seats[1].isMe}
            label={table.seats[1].occupied && table.seats[1].isMe ? 'Il tuo posto' : 'Posto 2'}
            light
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 px-5 sm:px-6">
        <MetaChip label="Prezzo" value={price} />
        <MetaChip label="Giocatori" value={`${seatedCount}/${maxPlayers}`} />
        <MetaChip label="Tipo" value={gameType} />
        {isMine && <StateChip started={table.started} opponentSeated={table.seats[1].occupied} />}
      </div>

      <footer className="mt-3 flex items-center justify-end gap-2 border-t border-slate-900/[0.06] bg-slate-50/50 px-5 py-3 sm:px-6">
        {table.kind === 'joinable' && (
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
              <SecondaryButton busy={busy} onClick={() => onOpen(table)} label="Apri tavolo" />
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
      </footer>
    </article>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-900/[0.07] bg-white px-2.5 py-1 text-[10px] shadow-sm">
      <span className="shrink-0 font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="truncate font-black text-slate-700">{value}</span>
    </span>
  );
}

function StateChip({ started, opponentSeated }: { started: boolean; opponentSeated: boolean }) {
  const label = started ? 'Partita pronta' : opponentSeated ? 'Ready check' : 'In attesa';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-header-bg/[0.05] px-2.5 py-1 text-[10px] font-extrabold text-slate-500">
      <span
        className={cn('h-1.5 w-1.5 rounded-full', started ? 'bg-emerald-500' : 'bg-slate-400')}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function PrimaryButton({ children, busy, onClick }: { children: React.ReactNode; busy?: boolean; onClick: () => void }) {
  return (
    <Button type="button" disabled={busy} onClick={onClick} className="gap-1.5">
      {children}
    </Button>
  );
}

function SecondaryButton({ busy, onClick, label }: { busy?: boolean; onClick: () => void; label: string }) {
  return <button type="button" disabled={busy} onClick={onClick} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-900/[0.12] bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-900/25 hover:text-header-bg disabled:opacity-50">{label}</button>;
}

function LeaveButton({ busy, onClick, label }: { busy?: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" disabled={busy} onClick={onClick} aria-label={label === 'Alzati' ? 'Alzati dal tavolo' : 'Abbandona la partita'} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-red-500/25 bg-transparent px-3.5 py-2 text-xs font-bold text-red-600 transition hover:border-red-500/50 hover:bg-red-50 disabled:opacity-50">
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
