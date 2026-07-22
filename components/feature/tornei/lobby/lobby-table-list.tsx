'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { FormatSelectorGrid } from '@/components/feature/tornei/format-selector-grid';
import { ModeSelectorRow } from '@/components/feature/tornei/mode-selector-row';
import type { SessionUser } from '@/types/auth';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import type { Selection } from '@/lib/validations/selection';
import type { LobbyTable } from '@/lib/lobby';
import { TableCard } from './table-card';

interface LobbyTableListProps {
  tables: LobbyTable[];
  user: SessionUser;
  selection: Selection;
  formatId: FormatId;
  formatName: string;
  modeName: string;
  busy: boolean;
  error: string | null;
  onSit: (table: LobbyTable) => void;
  onOpen: (table: LobbyTable) => void;
  onLeave: (table: LobbyTable) => void;
  onGoLive: (table: LobbyTable) => void;
}

export function LobbyTableList({
  tables,
  user,
  selection,
  formatId,
  formatName,
  modeName,
  busy,
  error,
  onSit,
  onOpen,
  onLeave,
  onGoLive,
}: LobbyTableListProps) {
  const openSeats = tables.reduce(
    (total, table) => total + table.seats.filter((seat) => !seat.occupied).length,
    0,
  );

  return (
    <>
      <DashboardHeader user={user} />
      <main
        data-lobby-focus-fallback="true"
        tabIndex={-1}
        className="mx-auto mt-5 flex w-full max-w-content animate-auth-enter flex-col px-4 pb-16 focus:outline-none sm:px-6"
      >
        <div className="sticky top-2 z-40 mb-6 overflow-visible rounded-[1.75rem] border border-white/10 bg-header-bg/95 px-4 py-4 text-white shadow-[0_18px_50px_-22px_rgba(15,23,42,0.72)] sm:px-5 sm:py-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Arena Ebartex</p>
              <h1 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">
                Scegli la tua partita
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
              <span className="rounded-full bg-primary/15 px-3 py-1.5 text-primary ring-1 ring-primary/30">
                {formatName}
              </span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-white/65 ring-1 ring-white/10">
                {modeName}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <section className="grid w-full gap-2 md:grid-cols-[7rem_minmax(0,1fr)] md:items-center md:gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">Passaggio 1</p>
                <h2
                  id="tornei-format-label"
                  className="mt-1 font-sans text-xs font-black uppercase tracking-widest text-white"
                >
                  Formato
                </h2>
              </div>
              <div className="w-full md:hidden">
                <FormatSelectorGrid
                  selectedFormatId={formatId}
                  currentModeId={selection.mode as ModeId}
                  mobile
                />
              </div>
              <div className="hidden w-full md:block">
                <FormatSelectorGrid
                  selectedFormatId={formatId}
                  currentModeId={selection.mode as ModeId}
                />
              </div>
            </section>
            <section className="grid w-full gap-2 border-t border-white/10 pt-3 md:grid-cols-[7rem_minmax(0,1fr)] md:items-center md:gap-4 sm:pt-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary/80">Passaggio 2</p>
                <h2 className="mt-1 font-sans text-xs font-black uppercase tracking-widest text-white">Modalità</h2>
              </div>
              <div className="w-full md:hidden">
                <ModeSelectorRow
                  selectedModeId={selection.mode as ModeId}
                  currentFormatId={formatId}
                  mobile
                />
              </div>
              <div className="hidden w-full max-w-3xl md:block">
                <ModeSelectorRow selectedModeId={selection.mode as ModeId} currentFormatId={formatId} />
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Lobby aperta</p>
            <h2 className="mt-1 font-sans text-xl font-black tracking-tight text-header-bg sm:text-2xl">
              Partite disponibili
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-header-bg/65">
            <span className="rounded-full border border-header-bg/10 bg-white/45 px-3 py-1.5">{openSeats} posti liberi</span>
            <span className="rounded-full border border-header-bg/10 bg-white/45 px-3 py-1.5">Best of 3</span>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-700/30 bg-red-100/80 px-3 py-2.5 text-sm font-semibold text-red-900"
          >
            {error}
          </p>
        )}
        <div
          className="mt-5 hidden grid-cols-[minmax(15rem,2fr)_minmax(6.5rem,0.65fr)_minmax(8rem,0.75fr)_minmax(8rem,0.8fr)_minmax(12.5rem,1fr)] gap-4 rounded-xl border border-header-bg/10 bg-white/45 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-header-bg/60 shadow-sm lg:grid"
          aria-hidden="true"
        >
          <span>Tavolo</span>
          <span>Prezzo</span>
          <span>Giocatori seduti</span>
          <span>Tipo di gioco</span>
          <span className="text-right">Azioni</span>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {tables.map((table) => (
            <TableCard
              key={table.key}
              table={table}
              busy={busy}
              onSit={onSit}
              onOpen={onOpen}
              onLeave={onLeave}
              onGoLive={onGoLive}
            />
          ))}
        </div>
      </main>
    </>
  );
}
