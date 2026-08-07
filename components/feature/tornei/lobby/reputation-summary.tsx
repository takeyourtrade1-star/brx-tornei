import { Swords, TrendingUp } from 'lucide-react';
import { evaluateAchievements } from '@/lib/data/achievements';
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
 * Aggregati dal ledger match_results + ultime 5 partite. "Contestate" non è
 * una statistica che interessa al giocatore: resta nel ledger interno.
 */
export function ReputationSummary({ reputation }: { reputation: ReputationSummaryData | null }) {
  const stats: ReputationSummaryData = reputation ?? {
    played: 0,
    wins: 0,
    losses: 0,
    abandoned: 0,
    disputed: 0,
    recent: [],
    history: [],
  };
  const decided = stats.wins + stats.losses;
  const winRate = decided > 0 ? Math.round((stats.wins / decided) * 100) : null;

  return (
    <section
      aria-label="Le tue partite"
      className="relative overflow-hidden rounded-2xl border border-slate-900/[0.08] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      {/* Accento brand misurato: punto + titolo, niente strisce in cima. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4 px-5 py-4 sm:px-6">
        <div className="flex min-w-40 items-center gap-3">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-header-bg text-white shadow-[0_10px_24px_-12px_rgba(15,23,42,0.55)]">
            <Swords className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Le tue partite
            </h2>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tabular-nums leading-none text-header-bg">
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
          <div className="hidden items-center gap-2 pl-4 sm:flex">
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
        <div className="px-5 pb-4 sm:px-6" aria-hidden="true">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#ff9a3d] transition-all"
              style={{ width: `${winRate ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Anteprima achievement: primi badge sbloccati, scoperta senza click. */}
      {stats.played > 0 && (
        <AchievementPreviewRow reputation={stats} />
      )}

      {reputation && reputation.recent.length > 0 && (
        <ul className="grid gap-0.5 border-t border-slate-900/[0.06] bg-slate-50/60 px-5 py-3 sm:px-6">
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

/** Strip con i primi N achievement sbloccati — suggerisce "apri il profilo". */
function AchievementPreviewRow({ reputation }: { reputation: ReputationSummaryData }) {
  const unlocked = evaluateAchievements(reputation).filter((a) => a.unlockedNow);
  if (unlocked.length === 0) return null;
  return (
    <div className="border-t border-slate-900/[0.06] bg-slate-50/60 px-5 py-2.5 sm:px-6">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        Badge sbloccati
      </p>
      <ul className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {unlocked.slice(0, 4).map((a) => {
          const Icon = a.icon;
          return (
            <li
              key={a.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/[0.07] bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm"
              title={a.description}
            >
              <Icon className="h-3 w-3 text-slate-500" strokeWidth={2.4} aria-hidden />
              {a.title}
            </li>
          );
        })}
        {unlocked.length > 4 && (
          <li className="inline-flex items-center rounded-full border border-slate-900/[0.07] bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm">
            +{unlocked.length - 4}
          </li>
        )}
      </ul>
    </div>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="min-w-16 px-2 py-1 text-center sm:px-4">
      <dd className={`text-xl font-black tabular-nums leading-none ${tone}`}>{value}</dd>
      <dt className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
    </div>
  );
}
