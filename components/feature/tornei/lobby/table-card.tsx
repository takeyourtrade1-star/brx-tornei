'use client';

import { LogOut, Play, UserPlus, Users } from 'lucide-react';
import { getBuyInLabel } from '@/lib/data/buy-in';
import type { BestOf } from '@/types/tournament';
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
  const bestOf: BestOf = table.tournament?.bestOf ?? 'BO3';
  const hostName = table.seats[0].occupied ? table.seats[0].username : null;
  const opponentSeat = table.seats.find((seat) => seat.occupied && !seat.isMe);
  const opponentName = opponentSeat?.occupied ? opponentSeat.username : null;
  const myConnection = table.seats.find((seat) => seat.occupied && seat.isMe);

  // Risoluzione della ripetizione "La tua postazione / Il tuo tavolo":
  // Definiamo eyebrow, titolo e badge di stato in base allo stato reale della partita.
  let eyebrow: string;
  let title: string;
  let statusBadge: { label: string; style: string } | null = null;

  if (isMine) {
    if (table.started) {
      eyebrow = 'PARTITA LIVE';
      title = opponentName ? `Sfida vs ${opponentName}` : 'Partita in corso';
      statusBadge = { label: 'In corso', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    } else if (opponentName) {
      eyebrow = 'SFIDA PRONTA';
      title = `Sfida vs ${opponentName}`;
      statusBadge = { label: 'Sfidante pronto', style: 'bg-amber-50 text-amber-700 border-amber-200' };
    } else {
      eyebrow = 'IL TUO TAVOLO';
      title = 'In attesa di sfidante';
      statusBadge = { label: 'Aperto', style: 'bg-primary/10 text-primary border-primary/20' };
    }
  } else if (table.kind === 'joinable') {
    eyebrow = 'SFIDA APERTA';
    title = hostName ? `Tavolo di ${hostName}` : 'Tavolo disponibile';
    statusBadge = { label: 'Disponibile', style: 'bg-blue-50 text-blue-700 border-blue-200' };
  } else {
    eyebrow = 'NUOVO TAVOLO';
    title = 'Apri un nuovo tavolo';
  }

  const handlePrimary = () => {
    if (busy) return;
    if (table.kind === 'empty' || table.kind === 'joinable') onSit(table);
    else if (table.started) onGoLive(table);
    else onOpen(table);
  };

  if (table.kind === 'empty') {
    return (
      <button
        type="button"
        disabled={busy || createLocked}
        onClick={handlePrimary}
        aria-label="Tavolo libero: siediti"
        className={cn(
          'group relative w-full rounded-2xl border-2 border-dashed border-slate-300/80 bg-white p-4.5 text-left shadow-sm transition-all sm:p-5',
          createLocked
            ? 'cursor-not-allowed opacity-70'
            : 'hover:border-primary/50 hover:shadow-md active:scale-[0.99]',
        )}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Tavolo libero</p>
            <h3 className="mt-0.5 font-sans text-base font-black leading-snug text-header-bg sm:text-lg">
              {createLocked ? 'Scegli un formato per creare un tavolo' : 'Tavolo libero'}
            </h3>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider',
              createLocked
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700',
            )}
          >
            {createLocked ? 'Formato richiesto' : 'Libero'}
          </span>
        </header>

        {/* Arena Giocatori */}
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
          <LobbySeat occupied={false} username={null} isMe={false} label="Giocatore 1" compact light />
          <VersusBadge light compact />
          <LobbySeat occupied={false} username={null} isMe={false} label="Giocatore 2" compact light />
        </div>

        {/* Footer Dettagli e Azioni */}
        {/* Footer Dettagli e Azioni — colonne fisse identiche all'indicatore a menù */}
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
          <div className="grid grid-cols-[5rem_4rem_4.5rem] items-center gap-2 text-[11px] font-bold text-slate-500">
            <span className="inline-flex min-w-0 items-center justify-center gap-1 overflow-hidden rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
              <Users className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden /> 0/2
            </span>
            <span className="truncate rounded-md bg-slate-100 px-2 py-0.5 text-center text-slate-700">
              {bestOf}
            </span>
            <span className="truncate rounded-md bg-slate-100 px-2 py-0.5 text-center uppercase text-slate-700">
              {price}
            </span>
          </div>

          {!createLocked && (
            <PrimaryButton busy={busy} onClick={handlePrimary}>
              <UserPlus className="h-4 w-4" aria-hidden /> SIEDITI
            </PrimaryButton>
          )}
        </footer>
      </button>
    );
  }

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-white p-4.5 shadow-sm transition-all sm:p-5',
        isMine
          ? 'border-primary/30 ring-1 ring-primary/20 shadow-md'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md',
      )}
    >
      {/* Striscia di accento per il proprio tavolo */}
      {isMine && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF7300] via-amber-500 to-[#e0564d]"
        />
      )}

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h3 className="mt-0.5 truncate font-sans text-base font-black leading-snug text-header-bg sm:text-lg">
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
            <ConnectionQualityBadge connection={myConnection?.occupied ? myConnection.connection : undefined} compact />
          )}
        </div>
      </header>

      {/* Arena Giocatori */}
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <LobbySeat
          occupied={table.seats[0].occupied}
          username={table.seats[0].occupied ? table.seats[0].username : null}
          isMe={table.seats[0].occupied && table.seats[0].isMe}
          label="Giocatore 1"
          compact
          light
        />
        <VersusBadge light compact />
        <LobbySeat
          occupied={table.seats[1].occupied}
          username={table.seats[1].occupied ? table.seats[1].username : null}
          isMe={table.seats[1].occupied && table.seats[1].isMe}
          label="Giocatore 2"
          compact
          light
        />
      </div>

      {/* Footer Dettagli e Azioni — colonne fisse identiche all'indicatore a menù */}
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
        <div className="grid grid-cols-[5rem_4rem_4.5rem] items-center gap-2 text-[11px] font-bold text-slate-500">
          <span className="inline-flex min-w-0 items-center justify-center gap-1 overflow-hidden rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
            <Users className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden /> {seatedCount}/2
          </span>
          <span className="truncate rounded-md bg-slate-100 px-2 py-0.5 text-center text-slate-700">
            {bestOf}
          </span>
          <span className="truncate rounded-md bg-slate-100 px-2 py-0.5 text-center uppercase text-slate-700">
            {price}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {table.kind === 'joinable' && (
            <PrimaryButton busy={busy} onClick={handlePrimary}>
              <UserPlus className="h-4 w-4" aria-hidden /> Siediti
            </PrimaryButton>
          )}
          {isMine && (
            <>
              <PrimaryButton
                busy={busy}
                onClick={() => (table.started || table.seats[1].occupied ? onGoLive(table) : onOpen(table))}
              >
                <Play className="h-4 w-4" aria-hidden />
                {table.started ? 'Partita' : table.seats[1].occupied ? 'Vai al tavolo' : 'Gestisci tavolo'}
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
    <Button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="h-9.5 min-h-[2.375rem] gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 text-xs font-black text-white shadow-sm hover:shadow-md transition-all hover:brightness-105 active:scale-[0.98]"
    >
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
      className="inline-flex h-9.5 min-h-[2.375rem] items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3.5 text-xs font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
