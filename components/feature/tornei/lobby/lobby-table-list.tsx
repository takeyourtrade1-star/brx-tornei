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
        className="mx-auto mt-6 flex w-full max-w-content animate-auth-enter flex-col px-4 pb-16 focus:outline-none sm:px-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              {formatName} · {modeName}
            </p>
            <h1 className="mt-1 font-sans text-2xl font-black tracking-tight text-header-bg sm:text-3xl">
              Partite disponibili
            </h1>
            <p className="mt-1 text-sm font-semibold text-header-bg/55">
              Scegli un tavolo libero oppure entra in una sfida già aperta.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-header-bg/65">
            <span className="rounded-full border border-header-bg/10 bg-white/55 px-3 py-1.5">{openSeats} posti liberi</span>
            <span className="rounded-full border border-header-bg/10 bg-white/55 px-3 py-1.5">Best of 3</span>
          </div>
        </div>

        <div className="relative z-30 my-5 overflow-visible rounded-2xl border border-white/10 bg-header-bg/95 px-4 py-3 text-white shadow-[0_14px_38px_-24px_rgba(15,23,42,0.78)] sm:px-5">
          <div className="flex flex-col gap-2.5">
            <section className="grid w-full gap-2 md:grid-cols-[5.5rem_minmax(0,1fr)] md:items-center md:gap-3">
              <h2
                id="tornei-format-label"
                className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-white/55"
              >
                Formato
              </h2>
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
                  dense
                />
              </div>
            </section>
            <section className="grid w-full gap-2 border-t border-white/10 pt-2.5 md:grid-cols-[5.5rem_minmax(0,1fr)] md:items-center md:gap-3">
              <h2 className="font-sans text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Modalità</h2>
              <div className="w-full md:hidden">
                <ModeSelectorRow
                  selectedModeId={selection.mode as ModeId}
                  currentFormatId={formatId}
                  mobile
                />
              </div>
              <div className="hidden w-full max-w-xl md:block">
                <ModeSelectorRow
                  selectedModeId={selection.mode as ModeId}
                  currentFormatId={formatId}
                  compact
                />
              </div>
            </section>
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
          className="hidden grid-cols-[minmax(15rem,2fr)_minmax(6.5rem,0.65fr)_minmax(8rem,0.75fr)_minmax(8rem,0.8fr)_minmax(12.5rem,1fr)] gap-4 border-y border-header-bg/15 bg-header-bg/[0.04] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-header-bg/55 lg:grid"
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
