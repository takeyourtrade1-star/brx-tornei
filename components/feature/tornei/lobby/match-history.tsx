import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { Swords, TrendingUp } from 'lucide-react';

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
  const decided = stats.wins + stats.losses;
  const winRate = decided > 0 ? Math.round((stats.wins / decided) * 100) : null;

  return (
    <div className="flex flex-col gap-5">
      <section className="relative overflow-hidden rounded-2xl border border-slate-900/[0.08] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#FF7300] via-[#ff9a3d] to-[#e0564d]"
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 px-5 py-5 sm:px-7">
          <div className="flex min-w-44 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#FF7300] to-[#e0564d] text-white shadow-[0_8px_20px_-6px_rgba(255,115,0,0.45)]">
              <Swords className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                Riepilogo
              </h2>
              <p className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-black tabular-nums leading-none text-header-bg">
                  {stats.played}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {stats.played === 1 ? 'partita' : 'partite'}
                </span>
              </p>
            </div>
          </div>

          <dl className="flex flex-1 items-stretch justify-end gap-2 sm:gap-0 sm:divide-x sm:divide-slate-900/[0.08]">
            <Counter label="Vinte" value={stats.wins} tone="text-emerald-600" />
            <Counter label="Perse" value={stats.losses} tone="text-red-500" />
            <Counter label="Abbandonate" value={stats.abandoned} tone="text-amber-600" />
            <div className="flex items-center gap-2 pl-4">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-black tabular-nums leading-none text-header-bg">
                  {winRate === null ? '—' : `${winRate}%`}
                </p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  vittorie
                </p>
              </div>
            </div>
          </dl>
        </div>

        {decided > 0 && (
          <div className="px-5 pb-5 sm:px-7" aria-hidden="true">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] transition-all"
                style={{ width: `${winRate ?? 0}%` }}
              />
            </div>
          </div>
        )}
      </section>

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

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="min-w-16 px-2 py-1 text-center sm:px-4">
      <dd className={`text-xl font-black tabular-nums leading-none ${tone}`}>{value}</dd>
      <dt className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
    </div>
  );
}
