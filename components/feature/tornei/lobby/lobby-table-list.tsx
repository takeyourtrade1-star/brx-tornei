'use client';

import { Coins, Swords, Users } from 'lucide-react';
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
        <div
          role="note"
          aria-label="Uso delle Proxy: È consentito l'impiego di proxy a colori, a condizione che siano riproduzioni in scala 1:1 perfettamente leggibili delle carte originali."
          className="proxy-marquee mb-4 overflow-hidden rounded-full border border-marquee/25 bg-header-bg/70 px-2 text-[11px] font-semibold italic leading-normal tracking-wide text-marquee backdrop-blur-sm whitespace-nowrap sm:text-xs"
        >
          <div className="proxy-marquee-track flex w-max" aria-hidden="true">
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="inline-flex shrink-0 items-center px-5 py-1.5 sm:px-7"
              >
                <span className="font-display font-black text-primary">
                  Uso delle Proxy:
                </span>
                <span className="ml-2">
                  È consentito l&apos;impiego di proxy a colori, a condizione che siano riproduzioni in scala 1:1 perfettamente leggibili delle carte originali.
                </span>
                <span className="ml-6 text-primary/75" aria-hidden="true">
                  •
                </span>
              </span>
            ))}
          </div>
        </div>

        <ReputationSummary reputation={reputation} />

        {/* Card unica dei selettori: Formato (1) e Modalità (2) vivono nello
            stesso contenitore glass, separati da un divider sottile. */}
        <div className="arena-panel relative z-30 my-5 divide-y divide-white/10">
          <section className="w-full px-4 py-4 sm:px-5">
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

          <section className="w-full px-4 py-3 sm:px-5">
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
              />
            </div>
          </section>
        </div>

        {/* Card unica contesto: titolo "Sfida i tuoi amici" + buy-in nella prima
            banda, indicatore tavoli con legenda nella seconda. */}
        <section
          aria-label="Contesto sfide e categorie tavoli"
          className="arena-panel mb-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                Sfida i tuoi amici
              </p>
              <h1 className="mt-0.5 font-sans text-xl font-black tracking-tight text-white sm:text-2xl">
                {formatName} · {modeName}
              </h1>
            </div>
            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-xs">
              Best of 3
            </span>
          </div>

          <nav
            aria-label="Categorie dei tavoli"
            className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-2.5 sm:px-5"
          >
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-[11px] font-black uppercase tracking-[0.16em] text-white/80">
                Tavoli disponibili
              </h2>
            </div>

            <ul className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider text-white/85 sm:gap-3">
              <li className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 backdrop-blur-xs">
                <Users className="h-3.5 w-3.5 text-blue-400 shrink-0" aria-hidden />
                <span>Giocatori</span>
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 backdrop-blur-xs">
                <Swords className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden />
                <span>Best of</span>
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 backdrop-blur-xs">
                <Coins className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden />
                <span>Buy in</span>
              </li>
            </ul>
          </nav>
        </section>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-200"
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
