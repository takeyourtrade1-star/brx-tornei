import type { ComponentType } from 'react';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { cn } from '@/lib/utils';
import { ClashingSwordsIcon } from '@/components/feature/tornei/lobby/clashing-swords-icon';
import {
  AbandonedEmblem,
  DisputedEmblem,
  LossEmblem,
  WinEmblem,
} from './partite-outcome-icons';

interface OutcomeTone {
  label: string;
  flavor: string;
  badge: string;
  text: string;
  icon: ComponentType<{ className?: string }>;
  iconColor: string;
}

const OUTCOME_TONE: Record<string, OutcomeTone> = {
  win: {
    label: 'Vittoria',
    flavor: 'Vittoria conquistata sul campo',
    badge: 'border-marquee/35 bg-marquee/10',
    text: 'text-marquee',
    icon: WinEmblem,
    iconColor: 'text-marquee',
  },
  loss: {
    label: 'Sconfitta',
    flavor: 'Sconfitta subita in battaglia',
    badge: 'border-rose-400/35 bg-rose-400/10',
    text: 'text-rose-300',
    icon: LossEmblem,
    iconColor: 'text-rose-400',
  },
  abandoned: {
    label: 'Abbandonata',
    flavor: 'Ritirata dal campo di battaglia',
    badge: 'border-amber-400/30 bg-amber-400/10',
    text: 'text-amber-300',
    icon: AbandonedEmblem,
    iconColor: 'text-amber-400',
  },
  disputed: {
    label: 'Contestata',
    flavor: 'Esito in attesa di verdetto',
    badge: 'border-slate-400/30 bg-slate-400/10',
    text: 'text-slate-300',
    icon: DisputedEmblem,
    iconColor: 'text-slate-300',
  },
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * Registro delle battaglie: ogni esito ha il suo emblema animato e il
 * suo tono cromatico; le righe entrano in sequenza con un piccolo ritardo.
 */
export function PartiteBattleLog({ reputation }: { reputation: ReputationSummaryData | null }) {
  const stats: ReputationSummaryData = reputation ?? {
    played: 0,
    wins: 0,
    losses: 0,
    abandoned: 0,
    disputed: 0,
    recent: [],
    history: [],
  };
  const rows = stats.history.length > 0 ? stats.history : stats.recent;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-header-bg/95 shadow-xl shadow-black/50 backdrop-blur-md">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
          Cronache di battaglia
        </h2>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white/60">
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/30">
            <ClashingSwordsIcon className="h-8 w-8" />
          </span>
          <p className="font-display text-lg font-black text-white/80">
            Nessuna battaglia combattuta
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-xs font-semibold leading-relaxed text-white/45">
            Appena chiudi la prima partita, la cronaca della battaglia comparirà qui.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {rows.map((m, index) => {
            const tone = OUTCOME_TONE[m.outcome] ?? OUTCOME_TONE.disputed;
            const Icon = tone.icon;
            return (
              <li
                key={index}
                className="pt-row-in relative flex flex-wrap items-center gap-3.5 px-5 py-4 sm:flex-nowrap sm:px-6"
                style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
              >
                <span
                  className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${tone.badge}`}
                >
                  <Icon className={`h-6 w-6 ${tone.iconColor}`} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white">
                    vs {m.opponentGamertag ?? 'Avversario'}
                  </span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    {tone.flavor}
                  </span>
                </span>

                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em]',
                    tone.badge,
                    tone.text,
                  )}
                >
                  {tone.label}
                </span>

                <span className="shrink-0 text-right text-[11px] font-semibold tabular-nums text-white/45">
                  {formatDuration(m.durationSeconds)} · {formatDate(m.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
