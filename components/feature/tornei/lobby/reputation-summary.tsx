import { Swords } from 'lucide-react';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';

const OUTCOME_LABEL: Record<string, string> = {
  win: 'Vinta',
  loss: 'Persa',
  abandoned: 'Abbandonata',
  disputed: 'Contestata',
};

const OUTCOME_TONE: Record<string, string> = {
  win: 'text-emerald-600',
  loss: 'text-red-500',
  abandoned: 'text-amber-600',
  disputed: 'text-slate-500',
};

/**
 * Card reputazione (Requisito 2): sempre visibile — anche a zero partite —
 * così la funzione è scopribile; i contatori a zero sono lo stato vuoto.
 * Aggregati dal ledger match_results + ultime 5 partite.
 */
export function ReputationSummary({ reputation }: { reputation: ReputationSummaryData | null }) {
  const stats = reputation ?? { played: 0, wins: 0, losses: 0, abandoned: 0, disputed: 0, recent: [] };

  return (
    <section
      aria-label="Le tue partite"
      className="rounded-2xl border border-slate-900/[0.08] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      <div className="flex items-center gap-2.5 border-b border-slate-900/[0.06] px-5 py-3.5">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/[0.08] text-primary">
          <Swords className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
          Le tue partite
        </h2>
        <span className="ml-auto text-[11px] font-semibold text-slate-400">
          {stats.played} {stats.played === 1 ? 'partita' : 'partite'}
        </span>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-slate-900/[0.06] sm:grid-cols-5">
        <Stat label="Giocate" value={stats.played} />
        <Stat label="Vinte" value={stats.wins} tone="text-emerald-600" />
        <Stat label="Perse" value={stats.losses} tone="text-red-500" />
        <Stat label="Abbandonate" value={stats.abandoned} tone="text-amber-600" />
        <Stat label="Contestate" value={stats.disputed} tone="text-slate-500" />
      </dl>

      {reputation && reputation.recent.length > 0 && (
        <ul className="grid gap-0.5 border-t border-slate-900/[0.06] px-5 py-3">
          {reputation.recent.slice(0, 5).map((m, index) => (
            <li key={index} className="flex items-center justify-between gap-2 py-1 text-sm">
              <span className="truncate font-semibold text-slate-700">
                vs {m.opponentGamertag ?? 'Avversario'}
              </span>
              <span className={`shrink-0 text-xs font-bold ${OUTCOME_TONE[m.outcome] ?? 'text-slate-500'}`}>
                {OUTCOME_LABEL[m.outcome] ?? m.outcome}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value, tone = 'text-header-bg' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex flex-col px-3 py-4 text-center">
      <dt className="order-2 mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className={`order-1 text-xl font-black tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}
