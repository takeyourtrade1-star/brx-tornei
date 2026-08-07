import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { Swords } from 'lucide-react';

const OUTCOME_LABEL: Record<string, string> = {
  win: 'Vinta',
  loss: 'Persa',
  abandoned: 'Abbandonata',
  disputed: 'Contestata',
};

const OUTCOME_BADGE: Record<string, string> = {
  win: 'bg-emerald-100 text-emerald-700',
  loss: 'bg-red-100 text-red-600',
  abandoned: 'bg-amber-100 text-amber-700',
  disputed: 'bg-slate-100 text-slate-600',
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

/** Storico partite completo (pagina /partite). */
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
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        <Counter label="Giocate" value={stats.played} />
        <Counter label="Vinte" value={stats.wins} tone="text-emerald-600" />
        <Counter label="Perse" value={stats.losses} tone="text-red-500" />
        <Counter label="Abbandonate" value={stats.abandoned} tone="text-amber-600" />
        <Counter label="Contestate" value={stats.disputed} tone="text-slate-500" />
      </dl>

      <div className="overflow-hidden rounded-2xl border border-slate-900/[0.08] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2.5 border-b border-slate-900/[0.06] px-5 py-3.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/[0.08] text-primary">
            <Swords className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            Storico partite
          </h2>
          <span className="ml-auto text-[11px] font-semibold text-slate-400">
            {rows.length} {rows.length === 1 ? 'voce' : 'voci'}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-bold text-slate-700">Ancora nessuna partita</p>
            <p className="mt-1 text-xs text-slate-400">
              Appena giochi il primo tavolo, qui comparirà il risultato.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-900/[0.05]">
            {rows.map((m, index) => (
              <li key={index} className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:flex-nowrap">
                <span
                  className={`inline-flex w-24 shrink-0 justify-center rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${OUTCOME_BADGE[m.outcome] ?? 'bg-slate-100 text-slate-600'}`}
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
      </div>
    </div>
  );
}

function Counter({ label, value, tone = 'text-header-bg' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-900/[0.08] bg-white px-3 py-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <dd className={`text-2xl font-black tabular-nums ${tone}`}>{value}</dd>
      <dt className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
    </div>
  );
}
