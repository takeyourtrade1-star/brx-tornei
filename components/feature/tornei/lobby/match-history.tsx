import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { MatchStatsGrid } from './match-stats-grid';

const OUTCOME_LABEL: Record<string, string> = {
  win: 'Vinta',
  loss: 'Persa',
  abandoned: 'Abbandonata',
  disputed: 'Contestata',
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

function badgeTone(outcome: string): string {
  switch (outcome) {
    case 'win':
      return 'bg-emerald-100 text-emerald-700';
    case 'loss':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-slate-100 text-slate-500';
  }
}

/** Storico partite completo (pagina /partite). "Contestate" resta nel ledger interno. */
export function MatchHistory({ reputation }: { reputation: ReputationSummaryData | null }) {
  const stats = reputation ?? {
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
    <div className="flex flex-col gap-6">
      <MatchStatsGrid stats={stats} />

      <section className="overflow-hidden rounded-2xl border border-slate-900/[0.08] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2.5 border-b border-slate-900/[0.06] px-5 py-3.5 sm:px-7">
          <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Storico partite
          </h2>
          <span className="ml-auto text-[11px] font-semibold text-slate-400">
            {rows.length} {rows.length === 1 ? 'voce' : 'voci'}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-bold text-slate-700">Nessuna partita giocata</p>
            <p className="mt-1 text-xs text-slate-400">
              Appena chiudi la prima partita, qui comparirà il risultato.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-900/[0.05]">
            {rows.map((m, index) => (
              <li key={index} className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:flex-nowrap sm:px-7">
                <span
                  className={`inline-flex w-24 shrink-0 justify-center rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${badgeTone(m.outcome)}`}
                >
                  {OUTCOME_LABEL[m.outcome] ?? m.outcome}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-header-bg">
                  vs {m.opponentGamertag ?? 'Avversario'}
                </span>
                <span className="text-right text-[11px] font-semibold text-slate-400 sm:shrink-0">
                  {formatDuration(m.durationSeconds)} · {formatDate(m.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
