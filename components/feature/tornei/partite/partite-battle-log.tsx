'use client';

import { useState } from 'react';
import type { ComponentType } from 'react';
import { ChevronDown } from 'lucide-react';
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
 * Registro delle battaglie compatto: mostra l'ultima per impostazione predefinita
 * ed è espandibile per visualizzare lo storico completo.
 */
export function PartiteBattleLog({ reputation }: { reputation: ReputationSummaryData | null }) {
  const [expanded, setExpanded] = useState(false);

  const stats: ReputationSummaryData = reputation ?? {
    played: 0,
    qualifiedMatches30m: 0,
    wins: 0,
    losses: 0,
    abandoned: 0,
    disputed: 0,
    recent: [],
    history: [],
  };
  const rows = stats.history.length > 0 ? stats.history : stats.recent;
  const displayedRows = expanded ? rows : rows.slice(0, 1);

  const handleOpenOpponent = (gamertag: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ebartex-open-player-profile', { detail: { gamertag } }),
      );
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-lg shadow-black/40 backdrop-blur-md">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-3.5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Cronache di battaglia
        </h2>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-300">
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
            <ClashingSwordsIcon className="h-6 w-6" />
          </span>
          <p className="font-display text-base font-bold text-white/80">
            Nessuna battaglia combattuta
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-relaxed text-slate-400">
            Appena chiudi la prima partita, la cronaca della battaglia comparirà qui.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-white/[0.06]">
            {displayedRows.map((m, index) => {
              const tone = OUTCOME_TONE[m.outcome] ?? OUTCOME_TONE.disputed;
              const Icon = tone.icon;
              const opponent = m.opponentGamertag;

              return (
                <li
                  key={index}
                  className="pt-row-in relative flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] sm:flex-nowrap sm:px-5 sm:py-3"
                  style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
                >
                  <span
                    className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${tone.badge}`}
                  >
                    <Icon className={`h-6 w-6 ${tone.iconColor}`} />
                  </span>

                  <span className="min-w-0 flex-1">
                    {opponent ? (
                      <button
                        type="button"
                        onClick={() => handleOpenOpponent(opponent)}
                        title={`Visualizza profilo di ${opponent}`}
                        className="block truncate text-left text-xs font-bold text-white hover:text-primary transition-colors sm:text-sm focus-visible:outline-none"
                      >
                        vs {opponent}
                      </button>
                    ) : (
                      <span className="block truncate text-xs font-bold text-white sm:text-sm">
                        vs Avversario
                      </span>
                    )}
                    <span className="block text-[10px] font-medium text-slate-400">
                      {tone.flavor}
                    </span>
                  </span>

                  <span
                    className={cn(
                      'shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]',
                      tone.badge,
                      tone.text,
                    )}
                  >
                    {tone.label}
                  </span>

                  <span className="shrink-0 text-right text-[11px] font-medium tabular-nums text-slate-400">
                    {formatDuration(m.durationSeconds)} · {formatDate(m.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>

          {rows.length > 1 && (
            <div className="border-t border-white/[0.06] p-2 text-center bg-white/[0.01]">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors focus-visible:outline-none"
              >
                <span>
                  {expanded
                    ? 'Mostra solo ultima battaglia'
                    : `Mostra tutte le battaglie (${rows.length - 1} altre)`}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
                    expanded && 'rotate-180',
                  )}
                />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
