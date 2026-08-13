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
    glow: 'drop-shadow-[0_6px_14px_rgba(180,83,9,0.45)]',
    label: 'Bronzo',
    chip: 'border-amber-700/40 bg-amber-700/15 text-amber-500',
  },
  silver: {
    gem: 'fill-slate-300',
    glow: 'drop-shadow-[0_6px_14px_rgba(148,163,184,0.4)]',
    label: 'Argento',
    chip: 'border-slate-300/40 bg-slate-300/10 text-slate-300',
  },
  gold: {
    gem: 'fill-amber-400',
    glow: 'drop-shadow-[0_6px_16px_rgba(251,191,36,0.5)]',
    label: 'Oro',
    chip: 'border-amber-400/40 bg-amber-400/15 text-amber-300',
  },
  legendary: {
    gem: 'fill-violet-400',
    glow: 'drop-shadow-[0_6px_18px_rgba(167,139,250,0.65)]',
    label: 'Leggendaria',
    chip: 'border-violet-400/40 bg-violet-400/15 text-violet-300',
  },
};

/** Gemma sfaccettata del tier; le leggendarie emanano scintille. */
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
 * Medaglie conquistate (solo sbloccate): gemma del tier + icona
 * dell'obiettivo e descrizione. Il data layer è lib/data/achievements.ts.
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
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-header-bg/95 shadow-xl shadow-black/50 backdrop-blur-md">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
          Medaglie conquistate
        </h2>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white/60">
          {unlocked.length} / {ACHIEVEMENTS.length}
        </span>
      </div>

      {unlocked.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-bold text-white/70">Nessuna medaglia ancora</p>
          <p className="mt-1 text-xs font-semibold text-white/45">
            La prima vittoria ti attende: ogni impresa lascia un segno.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-4">
          {unlocked.map((achievement) => {
            const Icon = achievement.icon;
            const tier = TIER_STYLE[achievement.tier];
            return (
              <li
                key={achievement.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur-md transition-colors hover:border-marquee/40 hover:bg-white/[0.09]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
                <span aria-hidden className="pt-shine" />

                <span className="relative mx-auto mb-2.5 grid h-14 w-14 place-items-center">
                  <TierGem tier={achievement.tier} className="h-14 w-14" />
                  <Icon
                    className="absolute left-1/2 top-[44%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    strokeWidth={2.4}
                    aria-hidden
                  />
                </span>

                <p className="truncate text-[11px] font-black leading-tight text-white">
                  {achievement.title}
                </p>
                <p className="mt-1 line-clamp-2 min-h-[2em] text-[10px] leading-snug text-white/50">
                  {achievement.description}
                </p>
                <span
                  className={cn(
                    'mt-2 inline-block rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em]',
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
