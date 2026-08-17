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
  bar: string;
}

const OUTCOME_STYLE: Record<string, OutcomeStyle> = {
  win: {
    label: 'Vittoria',
    short: 'V',
    Icon: WinEmblem,
    frame: 'border-emerald-400/25 bg-emerald-400/10',
    icon: 'text-emerald-300',
    bar: 'bg-emerald-400',
  },
  loss: {
    label: 'Sconfitta',
    short: 'P',
    Icon: LossEmblem,
    frame: 'border-rose-400/25 bg-rose-400/10',
    icon: 'text-rose-300',
    bar: 'bg-rose-400',
  },
  abandoned: {
    label: 'Ritirata',
    short: 'R',
    Icon: AbandonedEmblem,
    frame: 'border-amber-400/25 bg-amber-400/10',
    icon: 'text-amber-300',
    bar: 'bg-amber-400',
  },
  disputed: {
    label: 'Contestata',
    short: 'C',
    Icon: DisputedEmblem,
    frame: 'border-slate-400/25 bg-slate-400/10',
    icon: 'text-slate-300',
    bar: 'bg-slate-400',
  },
};

/** Sequenza degli ultimi risultati: mini-emblemi leggibili al posto dei dot anonimi. */
export function RecentResultsStrip({ recent }: { recent: RecentMatchResult[] }) {
  const results = recent.slice(0, 5);

  if (results.length === 0) {
    return (
      <p className="text-[10px] font-semibold leading-snug text-slate-400">
        Nessuna sfida ancora: il primo risultato apparirà qui.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">
          Forma recente
        </span>
        <span className="text-[8px] font-bold tabular-nums text-slate-500">
          Ultime {results.length}
        </span>
      </div>
      <ol
        aria-label={`Forma recente: ${results.map((result) => (OUTCOME_STYLE[result.outcome] ?? OUTCOME_STYLE.disputed).label).join(', ')}`}
        className="grid grid-cols-5 gap-1.5"
      >
        {results.map((result, index) => {
          const style = OUTCOME_STYLE[result.outcome] ?? OUTCOME_STYLE.disputed;
          const Icon = style.Icon;
          return (
            <li
              key={`${result.createdAt}-${index}`}
              title={`${style.label} vs ${result.opponentGamertag ?? 'avversario'}`}
              className={cn(
                'group/result relative flex h-9 min-w-0 items-center justify-center gap-1 overflow-hidden rounded-lg border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25',
                style.frame,
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0', style.icon)} />
              <span className={cn('text-[8px] font-black', style.icon)}>{style.short}</span>
              <span aria-hidden className={cn('absolute inset-x-1 bottom-0 h-px opacity-80', style.bar)} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
