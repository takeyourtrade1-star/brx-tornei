'use client';

import {
  Armchair,
  BadgeEuro,
  Gamepad2,
  LogOut,
  Play,
  UserPlus,
  Users,
  UsersRound,
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

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition duration-200',
        isMine
          ? 'border-primary/30 ring-1 ring-primary/10'
          : 'border-slate-900/[0.08] hover:-translate-y-0.5 hover:border-slate-900/[0.14] hover:shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)]',
      )}
    >
      <header className="flex flex-col gap-4 p-5 pb-0 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-2xl border',
              isMine
                ? 'border-primary/20 bg-primary/[0.07] text-primary'
                : 'border-slate-900/[0.06] bg-slate-50 text-slate-500',
            )}
          >
            <Armchair className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-400">
              {isMine ? 'La tua postazione' : seatedCount > 0 ? 'Sfida aperta' : 'Tavolo disponibile'}
            </p>
            <h3 className="mt-0.5 truncate text-base font-black text-header-bg sm:text-lg">{title}</h3>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 xl:max-w-2xl">
          <TableDatum icon={BadgeEuro} label="Prezzo" value={price} />
          <TableDatum icon={UsersRound} label="Giocatori" value={`${seatedCount}/${maxPlayers}`} />
          <TableDatum icon={Gamepad2} label="Tipo" value={gameType} />
        </div>
      </header>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-5 sm:gap-3">
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

      <footer className="mt-4 flex flex-col gap-3 border-t border-slate-900/[0.06] p-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {table.tournament?.withFriend && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold text-amber-700">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Tavolo amici
            </span>
          )}
          {isMine && (
            <TableStateBadge started={table.started} opponentSeated={table.seats[1].occupied} />
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
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
        </div>
      </footer>
    </article>
  );
}

function TableDatum({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-900/[0.06] bg-slate-50/80 px-2.5 py-2">
      <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-slate-400 shadow-sm sm:grid">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-xs font-black text-header-bg sm:text-sm">{value}</span>
      </span>
    </div>
  );
}

function TableStateBadge({ started, opponentSeated }: { started: boolean; opponentSeated: boolean }) {
  const label = started ? 'Partita pronta' : opponentSeated ? 'Ready check' : 'In attesa';
  return (
    <span className="rounded-full border border-slate-900/[0.08] bg-slate-50 px-3 py-1.5 text-[10px] font-extrabold text-slate-500">
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
  return <button type="button" disabled={busy} onClick={onClick} className="min-h-10 rounded-full border border-slate-900/[0.1] bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-slate-900/20 hover:text-header-bg disabled:opacity-50">{label}</button>;
}

function LeaveButton({ busy, onClick, label }: { busy?: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" disabled={busy} onClick={onClick} aria-label={label === 'Alzati' ? 'Alzati dal tavolo' : 'Abbandona la partita'} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-red-500/25 bg-red-50/60 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:border-red-500/40 hover:bg-red-50 disabled:opacity-50">
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
