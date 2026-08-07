import { Swords, Trophy, Skull, LogOut, TrendingUp, type LucideIcon } from 'lucide-react';
import { evaluateAchievements } from '@/lib/data/achievements';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { cn } from '@/lib/utils';

const OUTCOME_META: Record<string, { label: string; chip: string; dot: string }> = {
  win: { label: 'Vinta', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  loss: { label: 'Persa', chip: 'bg-red-50 text-red-600 ring-red-600/20', dot: 'bg-red-500' },
  abandoned: { label: 'Abbandonata', chip: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  disputed: { label: 'Contestata', chip: 'bg-slate-100 text-slate-500 ring-slate-500/20', dot: 'bg-slate-400' },
};

/**
 * Card reputazione (Requisito 2): sempre visibile — anche a zero partite —
 * così la funzione è scopribile; i contatori a zero sono lo stato vuoto.
 * Divisione: testata con anello vittorie → 4 contatori → barra win/loss →
 * ultime sfide → anticipazione badge. "Contestate" resta nel ledger interno.
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
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary/[0.08] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-emerald-500/[0.05] blur-3xl"
        aria-hidden
      />

      {/* Testata: titolo + anello vittorie */}
      <header className="relative flex flex-wrap items-center justify-between gap-4 px-5 pt-5 sm:px-6">
        <div className="flex min-w-40 items-center gap-3">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-header-bg text-white shadow-[0_10px_24px_-12px_rgba(15,23,42,0.55)]">
            <Swords className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Le tue partite
            </h2>
            <p className="mt-0.5 text-sm font-black text-header-bg">{stats.played} totali</p>
          </div>
        </div>
        <WinRateRing pct={winRate} />
      </header>

      {/* Quattro contatori separati da filetti, con aria attorno */}
      <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4">
        <StatBlock icon={Trophy} label="Vinte" value={stats.wins} tone="text-emerald-600" />
        <StatBlock icon={Skull} label="Perse" value={stats.losses} tone="text-red-500" />
        <StatBlock icon={LogOut} label="Abbandonate" value={stats.abandoned} tone="text-amber-600" />
        <StatBlock icon={TrendingUp} label="Vittorie %" value={winRate === null ? '—' : `${winRate}%`} tone="text-header-bg" last />
      </div>

      {/* Barra divisa vittorie/perso */}
      {decided > 0 && (
        <div className="px-5 pb-2 pt-4 sm:px-6" aria-hidden="true">
          <div className="flex h-2 w-full items-center gap-1">
            <div className="flex h-full flex-1 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                style={{ width: `${(stats.wins / decided) * 100}%` }}
              />
            </div>
            <div className="flex h-full flex-1 overflow-hidden rounded-full bg-red-100">
              <div
                className="ml-auto h-full rounded-full bg-gradient-to-l from-red-500 to-red-400"
                style={{ width: `${(stats.losses / decided) * 100}%` }}
              />
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
              {stats.wins} vittorie
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-red-500">
              {stats.losses} sconfitte
            </span>
          </div>
        </div>
      )}

      {/* Anteprima achievement: primi badge sbloccati, scoperta senza click. */}
      {stats.played > 0 && <AchievementPreviewRow reputation={stats} />}

      {/* Ultime sfide, divise e leggibili */}
      <div className="border-t border-slate-900/[0.06] px-5 pt-0 sm:px-6">
        <h3 className="flex items-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          <span className="h-px w-4 bg-slate-900/10" aria-hidden />
          Ultime sfide
        </h3>
        {reputation && reputation.recent.length > 0 ? (
          <ul className="flex flex-col">
            {reputation.recent.slice(0, 5).map((m, index) => {
              const meta = OUTCOME_META[m.outcome] ?? OUTCOME_META.disputed;
              return (
                <li
                  key={index}
                  className="flex items-center justify-between gap-3 border-t border-slate-900/[0.05] py-2.5 first:border-t-0"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', meta.dot)} aria-hidden />
                    <span className="truncate text-sm font-semibold text-slate-700">
                      vs {m.opponentGamertag ?? 'Avversario'}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ring-1 ring-inset',
                      meta.chip,
                    )}
                  >
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="pb-4 text-sm font-semibold text-slate-400">
            La tua prima sfida ti aspetta: siediti a un tavolo.
          </p>
        )}
      </div>
    </section>
  );
}

/** Anello conico del tasso di vittoria — il punto focale della card. */
function WinRateRing({ pct }: { pct: number | null }) {
  return (
    <span
      title={pct === null ? 'Nessuna partita terminata' : `${pct}% di vittorie`}
      className="grid h-16 w-16 shrink-0 place-items-center rounded-full shadow-[0_8px_20px_-10px_rgba(15,23,42,0.3)]"
      style={{
        background: pct === null
          ? 'conic-gradient(rgba(15,23,42,0.08) 0deg 360deg)'
          : `conic-gradient(#FF7300 ${pct * 3.6}deg, rgba(15,23,42,0.08) ${pct * 3.6}deg)`,
      }}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white">
        <span className="text-sm font-black tabular-nums leading-none text-header-bg">
          {pct === null ? '—' : `${pct}%`}
        </span>
      </span>
    </span>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
  tone,
  last = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-0.5 py-4 text-center',
        last ? '' : 'border-r border-slate-900/[0.06]',
        'justify-center',
      )}
    >
      <Icon className={cn('h-4 w-4', tone)} strokeWidth={2.2} aria-hidden="true" />
      <dd className={cn('mt-1 text-xl font-black tabular-nums leading-none sm:text-2xl', tone)}>{value}</dd>
      <dt className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
    </div>
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