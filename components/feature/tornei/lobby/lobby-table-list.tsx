'use client';

import {
  Armchair,
  BadgeEuro,
  Gamepad2,
  MousePointerClick,
  Users,
  type LucideIcon,
} from 'lucide-react';
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
            <span className="rounded-full border border-header-bg/10 bg-white/55 px-3 py-1.5">Best of 3</span>
          </div>
        </div>

        <div className="relative z-30 my-6 flex flex-col gap-4">
          <section>
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-stone-950 text-[9px] font-black text-white">
                01
              </span>
              <h2
                id="tornei-format-label"
                className="font-sans text-[11px] font-black uppercase tracking-[0.18em] text-header-bg/70"
              >
                Formato
              </h2>
            </div>
            <div className="overflow-visible rounded-[1.75rem] border border-white/15 bg-gradient-to-br from-stone-900 via-stone-950 to-zinc-950 px-3 py-2 text-white shadow-xl shadow-black/30 sm:px-4">
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
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-stone-950 text-[9px] font-black text-white">
                02
              </span>
              <h2 className="font-sans text-[11px] font-black uppercase tracking-[0.18em] text-header-bg/70">
                Modalità
              </h2>
            </div>
            <div className="w-full max-w-xl rounded-[1.75rem] border border-white/15 bg-gradient-to-br from-stone-900 via-stone-950 to-zinc-950 p-2 text-white shadow-xl shadow-black/30">
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
            </div>
          </section>
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
          className="hidden grid-cols-[minmax(15rem,2fr)_minmax(6.5rem,0.65fr)_minmax(8rem,0.75fr)_minmax(8rem,0.8fr)_minmax(12.5rem,1fr)] items-center gap-4 rounded-[1.35rem] border border-white/50 bg-white/35 px-3 py-2.5 shadow-sm backdrop-blur-md lg:grid"
          aria-hidden="true"
        >
          <ColumnPill icon={Armchair}>Tavolo</ColumnPill>
          <ColumnPill icon={BadgeEuro}>Prezzo</ColumnPill>
          <ColumnPill icon={Users}>Giocatori seduti</ColumnPill>
          <ColumnPill icon={Gamepad2}>Tipo di gioco</ColumnPill>
          <ColumnPill icon={MousePointerClick} alignRight>Azioni</ColumnPill>
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

function ColumnPill({
  icon: Icon,
  alignRight = false,
  children,
}: {
  icon: LucideIcon;
  alignRight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className={alignRight ? 'flex justify-end' : undefined}>
      <span className="inline-flex min-h-8 w-fit items-center gap-1.5 rounded-full border border-header-bg/5 bg-white/75 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-header-bg/65 shadow-sm">
        <Icon className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />
        {children}
      </span>
    </span>
  );
}
