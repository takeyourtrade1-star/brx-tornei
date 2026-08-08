import { Swords, Trophy, Skull, LogOut, type LucideIcon } from 'lucide-react';
import { evaluateAchievements } from '@/lib/data/achievements';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { cn } from '@/lib/utils';

const OUTCOME_META: Record<string, string> = {
  win: 'text-emerald-600',
  loss: 'text-red-500',
  abandoned: 'text-amber-600',
  disputed: 'text-slate-500',
};

/**
 * Strip reputazione (Requisito 2): sempre visibile — anche a zero partite —
 * così la funzione è scopribile. Layout compresso a una riga: emblem + contatori
 * + anello e, solo in caso di partite, una fila al massimo di ultime sfide.
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
  const recent = reputation?.recent ?? [];

  return (
    <section
      aria-label="Le tue partite"
      className="relative overflow-hidden rounded-2xl border border-slate-900/[0.08] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      {/* Banda unica: emblem + contatori + anello */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-header-bg text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.45)]">
            <Swords className="h-4 w-4" aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-white" aria-hidden />
          </span>
          <p className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Le tue partite
            </span>
            <span className="text-xs font-black tabular-nums leading-none text-header-bg">
              {stats.played} {stats.played === 1 ? 'partita' : 'partite'}
            </span>
          </p>
        </div>

        <dl className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
          <Counter icon={Trophy} label="Vinte" value={stats.wins} tone="text-emerald-600" />
          <Counter icon={Skull} label="Perse" value={stats.losses} tone="text-red-500" />
          <Counter icon={LogOut} label="Abbandonate" value={stats.abandoned} tone="text-amber-600" />
          {decided > 0 && (
            <span className="hidden h-6 w-px bg-slate-900/[0.08] sm:block" aria-hidden />
          )}
          {decided > 0 && (
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <div className="flex h-1 w-24 items-stretch overflow-hidden rounded-full bg-slate-100 sm:w-28">
                <span
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${(stats.wins / decided) * 100}%` }}
                />
                <span
                  className="ml-auto h-full rounded-full bg-gradient-to-l from-red-500 to-red-400"
                  style={{ width: `${(stats.losses / decided) * 100}%` }}
                />
              </div>
            </div>
          )}
        </dl>

        <WinRateRing pct={winRate} />
      </div>

      {recent.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1.5 border-t border-slate-900/[0.06] bg-slate-50/50 px-4 py-1.5 sm:px-5">
          <li className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
            Ultime sfide
          </li>
          {recent.slice(0, 4).map((m, index) => (
            <li
              key={index}
              className="inline-flex items-center gap-1 rounded-full border border-slate-900/[0.06] bg-white px-1.5 py-0.5 text-[10px] text-slate-700 shadow-sm"
              title={OUTCOME_META[m.outcome] ?? m.outcome}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  m.outcome === 'win' && 'bg-emerald-500',
                  m.outcome === 'loss' && 'bg-red-500',
                  m.outcome === 'abandoned' && 'bg-amber-500',
                  m.outcome === 'disputed' && 'bg-slate-400',
                )}
                aria-hidden
              />
              <span className="max-w-32 truncate">{m.opponentGamertag ?? 'Avversario'}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Anteprima achievement: primi badge sbloccati, senza cambi keeeper. */}
      {stats.played > 0 && <AchievementPreviewRow reputation={stats} />}
    </section>
  );
}

/** Anello conico del tasso di vittoria, tenuto basso e discreto. */
function WinRateRing({ pct }: { pct: number | null }) {
  return (
    <span
      title={pct === null ? 'Nessuna partita terminata' : `${pct}% di vittorie`}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-[0_4px_12px_-6px_rgba(15,23,42,0.2)]"
      style={{
        background: pct === null
          ? 'conic-gradient(rgba(15,23,42,0.08) 0deg 360deg)'
          : `conic-gradient(#FF7300 ${pct * 3.6}deg, rgba(15,23,42,0.08) ${pct * 3.6}deg)`,
      }}
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white">
        <span className="text-[9px] font-black tabular-nums leading-none text-header-bg">
          {pct === null ? '—' : `${pct}%`}
        </span>
      </span>
    </span>
  );
}

function Counter({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Icon className={cn('h-3.5 w-3.5 shrink-0', tone)} strokeWidth={2.2} aria-hidden="true" />
      <dd className={cn('text-base font-black tabular-nums leading-none', tone)}>{value}</dd>
      <dt className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
    </div>
  );
}

/** Strip chips con i primi N achievement sbloccati. */
function AchievementPreviewRow({ reputation }: { reputation: ReputationSummaryData }) {
  const unlocked = evaluateAchievements(reputation).filter((a) => a.unlockedNow);
  if (unlocked.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-900/[0.06] bg-slate-50/60 px-4 py-1.5 sm:px-5">
      <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
        Badge sbloccati
      </p>
      {unlocked.slice(0, 4).map((a) => {
        const Icon = a.icon;
        return (
          <span
            key={a.id}
            className="inline-flex items-center gap-1 rounded-full border border-slate-900/[0.07] bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-700 shadow-sm"
            title={a.description}
          >
            <Icon className="h-2.5 w-2.5 text-slate-500" strokeWidth={2.4} aria-hidden />
            {a.title}
          </span>
        );
      })}
      {unlocked.length > 4 && (
        <span className="inline-flex items-center rounded-full border border-slate-900/[0.07] bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500 shadow-sm">
          +{unlocked.length - 4}
        </span>
      )}
    </div>
  );
}