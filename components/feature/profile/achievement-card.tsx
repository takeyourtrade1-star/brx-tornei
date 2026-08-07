import type { EvaluatedAchievement } from '@/lib/data/achievements';
import { cn } from '@/lib/utils';

const TIER_STYLE: Record<
  EvaluatedAchievement['tier'],
  { ring: string; glow: string; label: string }
> = {
  bronze: {
    ring: 'border-amber-700/30 bg-amber-50/60',
    glow: 'shadow-[0_6px_18px_-8px_rgba(180,83,9,0.4)]',
    label: 'text-amber-800',
  },
  silver: {
    ring: 'border-slate-300/70 bg-slate-50',
    glow: 'shadow-[0_6px_18px_-8px_rgba(100,116,139,0.35)]',
    label: 'text-slate-600',
  },
  gold: {
    ring: 'border-amber-500/40 bg-amber-50',
    glow: 'shadow-[0_8px_22px_-10px_rgba(217,119,6,0.5)]',
    label: 'text-amber-700',
  },
  legendary: {
    ring: 'border-violet-500/40 bg-violet-50',
    glow: 'shadow-[0_10px_24px_-10px_rgba(139,92,246,0.45)]',
    label: 'text-violet-700',
  },
};

/** Card singolo achievement: piena se sbloccata, "opaca" (con progress) se no. */
export function AchievementCard({ achievement }: { achievement: EvaluatedAchievement }) {
  const Icon = achievement.icon;
  const tier = TIER_STYLE[achievement.tier];
  const { unlockedNow, progress } = achievement;

  return (
    <li
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition',
        tier.ring,
        unlockedNow ? tier.glow : 'opacity-60 saturate-[0.55]',
      )}
    >
      <span
        className={cn(
          'relative grid h-11 w-11 place-items-center rounded-full',
          unlockedNow
            ? 'bg-white text-header-bg shadow-sm ring-1 ring-inset ring-slate-900/[0.08]'
            : 'bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-900/[0.05]',
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        {unlockedNow && (
          <span
            className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[9px] font-black text-white"
            aria-label="Sbloccato"
          >
            ✓
          </span>
        )}
      </span>
      <div className="min-w-0">
        <p className={cn('truncate text-[11px] font-black leading-tight', tier.label)}>
          {achievement.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500">
          {achievement.description}
        </p>
        {!unlockedNow && progress && (
          <p className="mt-1 text-[9px] font-bold tabular-nums uppercase tracking-wider text-slate-400">
            {progress.current} / {progress.target}
          </p>
        )}
      </div>
    </li>
  );
}

/** Riepilogo sblocco (contatore + barra) sopra la griglia. */
export function AchievementSummary({ achievements }: { achievements: EvaluatedAchievement[] }) {
  const unlocked = achievements.filter((a) => a.unlockedNow).length;
  return (
    <div className="rounded-2xl border border-slate-900/[0.06] bg-slate-50 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Badge sbloccati
        </p>
        <p className="text-sm font-black tabular-nums text-header-bg">
          {unlocked}
          <span className="text-slate-400"> / {achievements.length}</span>
        </p>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${(unlocked / Math.max(1, achievements.length)) * 100}%` }}
        />
      </div>
    </div>
  );
}
