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
        'relative isolate overflow-hidden rounded-[2rem] text-white shadow-xl transition duration-200',
        isMine
          ? 'bg-header-bg p-[2px] shadow-global-bg-end/35'
          : 'border border-white/10 bg-gradient-to-br from-footer-start via-card2-end to-card2-end p-4 shadow-card2-end/25 hover:-translate-y-0.5 hover:border-white/25 hover:from-card4-start sm:p-5',
      )}
    >
      {isMine ? (
        <span
          className="tournament-table-aurora pointer-events-none absolute -inset-[85%]"
          aria-hidden="true"
        />
      ) : (
        <span
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-card4-start/15 blur-3xl"
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'relative',
          isMine &&
            'overflow-hidden rounded-[calc(2rem-2px)] border border-white/10 bg-header-bg/95 p-4 backdrop-blur-xl sm:p-5',
        )}
      >
        {isMine && (
          <>
            <span
              className="tournament-table-glow-a pointer-events-none absolute -left-28 -top-16 h-56 w-80 rounded-full bg-card3-start/20 blur-3xl"
              aria-hidden="true"
            />
            <span
              className="tournament-table-glow-b pointer-events-none absolute -bottom-24 -right-24 h-64 w-96 rounded-full bg-global-bg-start/20 blur-3xl"
              aria-hidden="true"
            />
          </>
        )}

        <header className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white">
              <Armchair className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.17em] text-white/45">
                {isMine ? 'La tua postazione' : seatedCount > 0 ? 'Sfida aperta' : 'Tavolo disponibile'}
              </p>
              <h3 className="mt-0.5 truncate text-base font-black text-white sm:text-lg">{title}</h3>
              <p className="mt-0.5 truncate text-xs font-semibold text-white/55">{subtitle}</p>
            </div>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 xl:max-w-2xl">
            <TableDatum icon={BadgeEuro} label="Prezzo" value={price} />
            <TableDatum icon={UsersRound} label="Giocatori" value={`${seatedCount}/${maxPlayers}`} />
            <TableDatum icon={Gamepad2} label="Tipo" value={gameType} />
          </div>
        </header>

        <div className="relative mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <LobbySeat
            occupied={table.seats[0].occupied}
            username={table.seats[0].occupied ? table.seats[0].username : null}
            isMe={table.seats[0].occupied && table.seats[0].isMe}
            label={table.seats[0].occupied && table.seats[0].isMe ? 'Il tuo posto' : 'Posto 1'}
          />
          <VersusBadge />
          <LobbySeat
            occupied={table.seats[1].occupied}
            username={table.seats[1].occupied ? table.seats[1].username : null}
            isMe={table.seats[1].occupied && table.seats[1].isMe}
            label={table.seats[1].occupied && table.seats[1].isMe ? 'Il tuo posto' : 'Posto 2'}
          />
        </div>

        <footer className="relative mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {table.tournament?.withFriend && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-marquee/25 bg-marquee/10 px-3 py-1.5 text-[10px] font-extrabold text-marquee">
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
      </div>
    </article>
  );
}

function TableDatum({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-2.5 py-2">
      <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white/65 sm:grid">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[8px] font-black uppercase tracking-[0.12em] text-white/40">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-xs font-black text-white sm:text-sm">{value}</span>
      </span>
    </div>
  );
}

function TableStateBadge({ started, opponentSeated }: { started: boolean; opponentSeated: boolean }) {
  const label = started ? 'Partita pronta' : opponentSeated ? 'Ready check' : 'In attesa';
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[10px] font-extrabold text-white/75">
      {label}
    </span>
  );
}

function PrimaryButton({ children, busy, onClick }: { children: React.ReactNode; busy?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={busy} onClick={onClick} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-primary/15 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50">
      {children}
    </button>
  );
}

function SecondaryButton({ busy, onClick, label }: { busy?: boolean; onClick: () => void; label: string }) {
  return <button type="button" disabled={busy} onClick={onClick} className="min-h-10 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2.5 text-xs font-bold text-white/85 transition hover:bg-white/15 disabled:opacity-50">{label}</button>;
}

function LeaveButton({ busy, onClick, label }: { busy?: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" disabled={busy} onClick={onClick} aria-label={label === 'Alzati' ? 'Alzati dal tavolo' : 'Abbandona la partita'} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/15 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-destructive/25 disabled:opacity-50">
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
