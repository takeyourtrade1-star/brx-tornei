import type { ComponentType } from 'react';
import type { RecentMatchResult } from '@/lib/data/player-api-client';
import { cn } from '@/lib/utils';
import {
  AbandonedEmblem,
  DisputedEmblem,
  LossEmblem,
  WinEmblem,
} from '@/components/feature/tornei/partite/partite-outcome-icons';

interface OutcomeStyle {
  label: string;
  short: string;
  Icon: ComponentType<{ className?: string }>;
  frame: string;
  icon: string;
  glow: string;
  bar: string;
}

const OUTCOME_STYLE: Record<string, OutcomeStyle> = {
  win: {
    label: 'Vittoria',
    short: 'V',
    Icon: WinEmblem,
    frame:
      'border-emerald-400/40 bg-emerald-950/50 text-emerald-300 hover:border-emerald-400/80 hover:bg-emerald-950/75 shadow-[0_0_12px_rgba(52,211,153,0.18)]',
    icon: 'text-emerald-300',
    glow: 'bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.30),transparent_70%)]',
    bar: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
  },
  loss: {
    label: 'Sconfitta',
    short: 'P',
    Icon: LossEmblem,
    frame:
      'border-rose-400/40 bg-rose-950/50 text-rose-300 hover:border-rose-400/80 hover:bg-rose-950/75 shadow-[0_0_12px_rgba(244,63,94,0.18)]',
    icon: 'text-rose-300',
    glow: 'bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.30),transparent_70%)]',
    bar: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.9)]',
  },
  abandoned: {
    label: 'Ritirata',
    short: 'R',
    Icon: AbandonedEmblem,
    frame:
      'border-amber-400/40 bg-amber-950/50 text-amber-300 hover:border-amber-400/80 hover:bg-amber-950/75 shadow-[0_0_12px_rgba(251,191,36,0.18)]',
    icon: 'text-amber-300',
    glow: 'bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.30),transparent_70%)]',
    bar: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]',
  },
  disputed: {
    label: 'Contestata',
    short: 'C',
    Icon: DisputedEmblem,
    frame:
      'border-slate-400/40 bg-slate-900/50 text-slate-300 hover:border-slate-400/80 hover:bg-slate-900/75 shadow-[0_0_12px_rgba(148,163,184,0.15)]',
    icon: 'text-slate-300',
    glow: 'bg-[radial-gradient(ellipse_at_top,rgba(148,163,184,0.25),transparent_70%)]',
    bar: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.8)]',
  },
};

const MAX_RECENT_SLOTS = 5;

/** Sequenza degli ultimi risultati: gettoni di battaglia ad alto impatto grafico. */
export function RecentResultsStrip({ recent }: { recent: RecentMatchResult[] }) {
  const results = recent.slice(0, MAX_RECENT_SLOTS);
  const emptySlotsCount = Math.max(0, MAX_RECENT_SLOTS - results.length);

  const winsInRecent = results.filter((r) => r.outcome === 'win').length;
  const lossesInRecent = results.filter((r) => r.outcome === 'loss').length;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 sm:text-[9px]">
            Battaglie recenti
          </span>
        </div>
        {results.length > 0 && (
          <span className="text-[8px] font-bold tabular-nums text-slate-400 sm:text-[9px]">
            {winsInRecent}V - {lossesInRecent}P nelle ultime {results.length}
          </span>
        )}
      </div>

      <ol
        aria-label={`Battaglie recenti: ${results.length > 0 ? results.map((result) => (OUTCOME_STYLE[result.outcome] ?? OUTCOME_STYLE.disputed).label).join(', ') : 'Nessuna sfida'}`}
        className="grid grid-cols-5 gap-1.5 sm:gap-2"
      >
        {results.map((result, index) => {
          const style = OUTCOME_STYLE[result.outcome] ?? OUTCOME_STYLE.disputed;
          const Icon = style.Icon;
          const isLatest = index === 0;

          return (
            <li
              key={`${result.createdAt}-${index}`}
              title={`${style.label} ${result.opponentGamertag ? `vs ${result.opponentGamertag}` : ''}`}
              className={cn(
                'group/result relative flex h-11 sm:h-12 min-w-0 flex-col items-center justify-between overflow-hidden rounded-xl border p-1 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5',
                style.frame,
              )}
            >
              {/* Radial glow interno */}
              <span aria-hidden className={cn('pointer-events-none absolute inset-0 opacity-70', style.glow)} />

              {/* Indicatore ultima partita giocata */}
              {isLatest && (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-slate-950 animate-ping opacity-75"
                />
              )}

              {/* Header del token: icona + lettera */}
              <div className="relative flex w-full items-center justify-center gap-1 pt-0.5">
                <Icon className={cn('h-4 w-4 shrink-0 drop-shadow-[0_0_6px_currentColor]', style.icon)} />
                <span className={cn('font-display text-[11px] font-black leading-none sm:text-xs', style.icon)}>
                  {style.short}
                </span>
              </div>

              {/* Didascalia del token: avversario o etichetta */}
              <span className="relative z-10 w-full truncate text-center text-[7.5px] font-bold uppercase tracking-wider text-slate-300/90 sm:text-[8px]">
                {result.opponentGamertag ? `vs ${result.opponentGamertag}` : style.label}
              </span>

              {/* Barra LED di chiusura alla base */}
              <span aria-hidden className={cn('absolute inset-x-1 bottom-0 h-0.5 rounded-full opacity-90', style.bar)} />
            </li>
          );
        })}

        {/* Slot vuoti in attesa di nuove partite */}
        {Array.from({ length: emptySlotsCount }).map((_, i) => (
          <li
            key={`empty-slot-${i}`}
            aria-hidden="true"
            className="relative flex h-11 sm:h-12 min-w-0 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-1 text-slate-600 transition-colors"
          >
            <span className="font-display text-[10px] font-bold text-slate-600/70">—</span>
            <span className="text-[7px] font-semibold uppercase tracking-wider text-slate-600">
              Slot {results.length + i + 1}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
