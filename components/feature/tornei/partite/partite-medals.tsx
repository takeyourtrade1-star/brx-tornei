import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { ACHIEVEMENTS, evaluateAchievements } from '@/lib/data/achievements';
import type { AchievementTier } from '@/lib/data/achievements';
import { cn } from '@/lib/utils';

const TIER_STYLE: Record<
  AchievementTier,
  { gem: string; glow: string; label: string; chip: string }
> = {
  bronze: {
    gem: 'fill-amber-700',
    glow: 'drop-shadow-[0_4px_10px_rgba(180,83,9,0.35)]',
    label: 'Bronzo',
    chip: 'border-amber-700/40 bg-amber-700/15 text-amber-500',
  },
  silver: {
    gem: 'fill-slate-300',
    glow: 'drop-shadow-[0_4px_10px_rgba(148,163,184,0.3)]',
    label: 'Argento',
    chip: 'border-slate-300/40 bg-slate-300/10 text-slate-300',
  },
  gold: {
    gem: 'fill-amber-400',
    glow: 'drop-shadow-[0_4px_12px_rgba(251,191,36,0.4)]',
    label: 'Oro',
    chip: 'border-amber-400/40 bg-amber-400/15 text-amber-300',
  },
  legendary: {
    gem: 'fill-violet-400',
    glow: 'drop-shadow-[0_4px_14px_rgba(167,139,250,0.5)]',
    label: 'Leggendaria',
    chip: 'border-violet-400/40 bg-violet-400/15 text-violet-300',
  },
};

/** Gemma sfaccettata del tier con brillantezza. */
function TierGem({ tier, className }: { tier: AchievementTier; className?: string }) {
  const t = TIER_STYLE[tier];
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn(t.glow, className)}>
      <path d="M12 2.6 17.8 8 12 21.4 6.2 8z" className={t.gem} />
      <path d="M12 2.6 6.2 8 12 11.2z" className="fill-white/35" />
      <path d="M12 2.6 17.8 8 12 11.2z" className="fill-white/12" />
      <path d="M12 11.2 12 21.4 8.8 12.4z" className="fill-black/15" />
      <path d="M12 11.2 12 21.4 15.2 12.4z" className="fill-black/25" />
      {tier === 'legendary' && (
        <>
          <path
            className="pt-medal-spark fill-white"
            d="M20.6 2.2l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z"
          />
          <path
            className="pt-medal-spark fill-white/90"
            d="M4.4 6.2l.35.9.9.35-.9.35-.35.9-.35-.9-.9-.35.9-.35z"
            style={{ animationDelay: '0.8s' }}
          />
        </>
      )}
    </svg>
  );
}

/**
 * Medaglie conquistate: griglia armoniosa con gemme sfaccettate e descrizioni leggibili.
 */
export function PartiteMedals({ reputation }: { reputation: ReputationSummaryData | null }) {
  const stats: ReputationSummaryData = reputation ?? {
    played: 0,
    wins: 0,
    losses: 0,
    abandoned: 0,
    disputed: 0,
    recent: [],
    history: [],
  };
  const unlocked = evaluateAchievements(stats).filter((a) => a.unlockedNow);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-lg shadow-black/40 backdrop-blur-md">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-3.5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Medaglie conquistate
        </h2>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-300">
          {unlocked.length} / {ACHIEVEMENTS.length}
        </span>
      </div>

      {unlocked.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs font-bold text-white/70">Nessuna medaglia ancora</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            La prima vittoria ti attende: ogni impresa lascia un segno.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 sm:gap-3 sm:p-4 lg:grid-cols-4">
          {unlocked.map((achievement) => {
            const Icon = achievement.icon;
            const tier = TIER_STYLE[achievement.tier];
            return (
              <li
                key={achievement.id}
                className="group relative flex flex-col items-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-marquee/35 hover:bg-white/[0.06]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
                />
                <span aria-hidden className="pt-shine" />

                <span className="relative mx-auto mb-1.5 grid h-10 w-10 place-items-center">
                  <TierGem tier={achievement.tier} className="h-10 w-10" />
                  <Icon
                    className="absolute left-1/2 top-[44%] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    strokeWidth={2.4}
                    aria-hidden
                  />
                </span>

                <p className="w-full truncate text-[11px] font-black text-white">
                  {achievement.title}
                </p>
                <p className="mt-0.5 line-clamp-2 min-h-[2.4em] text-[10px] leading-snug text-slate-400">
                  {achievement.description}
                </p>
                <span
                  className={cn(
                    'mt-2 inline-block rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em]',
                    tier.chip,
                  )}
                >
                  {tier.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
