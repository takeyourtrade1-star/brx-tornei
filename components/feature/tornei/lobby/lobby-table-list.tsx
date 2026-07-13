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
  return (
    <>
      <DashboardHeader user={user} />
      <main className="mx-auto mt-4 flex w-full max-w-content animate-auth-enter flex-col px-4 pb-16 sm:px-6">
        <div className="sticky top-2 z-40 mb-5 rounded-3xl border border-white/[0.08] bg-header-bg/95 px-4 py-4 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.35)] sm:px-5">
          <div className="flex flex-col items-center gap-4">
            <section className="flex w-full flex-col items-center gap-2">
              <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-white/50">Formato</h2>
              <FormatSelectorGrid selectedFormatId={formatId} currentModeId={selection.mode as ModeId} />
            </section>
            <section className="flex w-full flex-col items-center gap-2 border-t border-white/10 pt-3">
              <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-white/50">Modalità</h2>
              <ModeSelectorRow selectedModeId={selection.mode as ModeId} currentFormatId={formatId} />
            </section>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-sans text-base font-bold uppercase tracking-widest text-white/70 sm:text-lg">
            Tavoli <span className="text-white">{formatName}</span>
            <span className="mx-2 text-white/40" aria-hidden>·</span>
            <span className="text-white/60">{modeName}</span>
          </h1>
          <span className="text-xs font-semibold uppercase tracking-wide text-white/40">Best of 3</span>
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-3">
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
