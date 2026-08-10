'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { FormatSelectorGrid } from '@/components/feature/tornei/format-selector-grid';
import { ModeSelectorRow } from '@/components/feature/tornei/mode-selector-row';
import type { SessionUser } from '@/types/auth';
import type { FormatFilter, Selection } from '@/lib/validations/selection';
import type { LobbyTable } from '@/lib/lobby';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { ReputationSummary } from './reputation-summary';
import { TableCard } from './table-card';

interface LobbyTableListProps {
  tables: LobbyTable[];
  user: SessionUser;
  /** Gamertag torneo-only mostrato nell'header al posto di email/username. */
  gamertag?: string;
  selection: Selection;
  formatId: FormatFilter;
  formatName: string;
  modeName: string;
  busy: boolean;
  error: string | null;
  reputation: ReputationSummaryData | null;
  /** Su "Tutti i formati" i tavoli vuoti non sono creabili. */
  createLocked: boolean;
  onSit: (table: LobbyTable) => void;
  onOpen: (table: LobbyTable) => void;
  onLeave: (table: LobbyTable) => void;
  onGoLive: (table: LobbyTable) => void;
}

export function LobbyTableList({
  tables,
  user,
  gamertag,
  selection,
  formatId,
  formatName,
  modeName,
  busy,
  error,
  reputation,
  createLocked,
  onSit,
  onOpen,
  onLeave,
  onGoLive,
}: LobbyTableListProps) {
  return (
    <>
      <DashboardHeader user={user} displayName={gamertag} reputation={reputation} />
      <main
        data-lobby-focus-fallback="true"
        tabIndex={-1}
        className="mx-auto mt-6 flex w-full max-w-content animate-auth-enter flex-col px-4 pb-16 focus:outline-none sm:px-6"
      >
        <ReputationSummary reputation={reputation} />

        <div className="relative z-30 my-4 flex flex-col gap-5">
          <section className="w-full">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/[0.08] text-[9px] font-black text-primary">
                1
              </span>
              <h2
                id="tornei-format-label"
                className="font-sans text-[11px] font-black uppercase tracking-[0.16em] text-slate-500"
              >
                Formato
              </h2>
            </div>
            <div className="w-full md:hidden">
              <FormatSelectorGrid
                selectedFormatId={formatId}
                currentModeId={selection.mode}
                mobile
              />
            </div>
            <div className="hidden w-full md:block">
              <FormatSelectorGrid
                selectedFormatId={formatId}
                currentModeId={selection.mode}
                dense
              />
            </div>
          </section>

          <section className="w-full">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/[0.08] text-[9px] font-black text-primary">
                2
              </span>
              <h2 className="font-sans text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Modalità
              </h2>
            </div>
            <div className="w-full md:hidden">
              <ModeSelectorRow
                selectedModeId={selection.mode}
                currentFormatId={formatId}
                mobile
              />
            </div>
            <div className="hidden w-full md:block">
              <ModeSelectorRow
                selectedModeId={selection.mode}
                currentFormatId={formatId}
                lightPanel
              />
            </div>
          </section>
        </div>

        <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                {formatName} · {modeName}
              </p>
              <h1 className="mt-1 font-sans text-xl font-black tracking-tight text-header-bg sm:text-2xl">
                Sfida i tuoi amici
              </h1>
              <p className="mt-1 text-sm font-semibold text-header-bg/55">
                Gioca in P2P e divertiti.
              </p>
            </div>
            <span className="rounded-full border border-header-bg/10 bg-slate-50/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-header-bg/65">
              Best of 3
            </span>
        </section>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-700/30 bg-red-100/80 px-3 py-2.5 text-sm font-semibold text-red-900"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col gap-4" aria-label="Tavoli disponibili">
          {tables.map((table) => (
            <TableCard
              key={table.key}
              table={table}
              busy={busy}
              createLocked={createLocked}
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
