import { Check, LockKeyhole } from 'lucide-react';
import type { EvaluatedAchievement } from '@/lib/data/achievements';
import { cn } from '@/lib/utils';
import { ACHIEVEMENT_ICONS } from './achievement-icons';
import { GreatPlayerBadgeIcon } from '@/components/feature/tornei/match/honor-badge-icons-positive';

const TIER_STYLE: Record<
  EvaluatedAchievement['tier'],
  { label: string; icon: string; chip: string; glow: string; progress: string }
> = {
  bronze: {
    label: 'Bronzo',
    icon: 'text-amber-500',
    chip: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    glow: 'bg-amber-500/25',
    progress: 'bg-amber-500',
  },
  silver: {
    label: 'Argento',
    icon: 'text-slate-200',
    chip: 'border-slate-300/25 bg-slate-200/10 text-slate-200',
    glow: 'bg-slate-300/20',
    progress: 'bg-slate-300',
  },
  gold: {
    label: 'Oro',
    icon: 'text-amber-300',
    chip: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
    glow: 'bg-amber-300/25',
    progress: 'bg-amber-300',
  },
  legendary: {
    label: 'Leggenda',
    icon: 'text-violet-300',
    chip: 'border-violet-300/30 bg-violet-400/10 text-violet-200',
    glow: 'bg-violet-400/25',
    progress: 'bg-violet-400',
  },
};

/** Card achievement scura, con emblema animato a pieno sfondo e stato leggibile. */
export function AchievementCard({ achievement }: { achievement: EvaluatedAchievement }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.id] ?? achievement.icon;
  const tier = TIER_STYLE[achievement.tier];
  const { unlockedNow, progress } = achievement;
  const progressPercent = progress
    ? Math.min(100, Math.round((progress.current / Math.max(1, progress.target)) * 100))
    : 0;

  return (
    <li
      aria-label={`${achievement.title}, ${unlockedNow ? 'sbloccato' : 'bloccato'}${progress ? `, ${progress.current} su ${progress.target}` : ''}`}
      className={cn(
        'group relative min-h-[154px] overflow-hidden rounded-2xl border bg-slate-950/90 p-3.5 shadow-lg shadow-slate-950/20 backdrop-blur-md transition-all duration-300',
        unlockedNow
          ? 'border-white/10 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-xl hover:shadow-slate-950/30'
          : 'border-slate-700/35 bg-slate-950/75',
      )}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -bottom-10 -right-8 h-32 w-32 rounded-full blur-3xl transition-opacity duration-300',
          unlockedNow ? cn(tier.glow, 'opacity-70 group-hover:opacity-100') : 'bg-slate-500/10 opacity-60',
        )}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.035] via-transparent to-slate-950/65" />

      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -bottom-1 -right-2 h-24 w-24 transition-all duration-500 [mask-image:radial-gradient(circle_at_center,black_45%,transparent_82%)] group-hover:scale-110',
          unlockedNow ? cn(tier.icon, 'opacity-30 group-hover:opacity-50') : 'text-slate-500 opacity-[0.14]',
        )}
      >
        <Icon className="h-full w-full" />
      </div>

      {unlockedNow && <span aria-hidden className="achievement-card-shine" />}

      <div className="relative z-10 flex min-h-[126px] flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em]', unlockedNow ? tier.chip : 'border-slate-700/60 bg-slate-800/60 text-slate-500')}>
            {tier.label}
          </span>
          <span
            className={cn(
              'grid h-5 w-5 place-items-center rounded-full border',
              unlockedNow
                ? 'border-emerald-300/35 bg-emerald-400/15 text-emerald-300'
                : 'border-slate-700 bg-slate-800/80 text-slate-500',
            )}
          >
            {unlockedNow ? (
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            ) : (
              <LockKeyhole className="h-2.5 w-2.5" strokeWidth={2.4} aria-hidden />
            )}
          </span>
        </div>

        <div className="mt-auto max-w-[88%]">
          <p className={cn('text-[11px] font-black leading-tight', unlockedNow ? 'text-white' : 'text-slate-400')}>
            {achievement.title}
          </p>
          <p className={cn('mt-1 line-clamp-2 text-[9px] font-medium leading-snug', unlockedNow ? 'text-slate-300' : 'text-slate-500')}>
            {achievement.description}
          </p>

          {!unlockedNow && progress && (
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-500">
                <span>Progresso</span>
                <span className="tabular-nums text-slate-400">{progress.current}/{progress.target}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/5">
                <div className={cn('h-full rounded-full transition-[width] duration-700', tier.progress)} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/** Riepilogo sblocco coordinato alle nuove card scure. */
export function AchievementSummary({ achievements }: { achievements: EvaluatedAchievement[] }) {
  const unlocked = achievements.filter((achievement) => achievement.unlockedNow).length;
  const percentage = Math.round((unlocked / Math.max(1, achievements.length)) * 100);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3.5 shadow-lg shadow-slate-950/20">
      <span aria-hidden className="pointer-events-none absolute -right-5 -top-8 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
      <GreatPlayerBadgeIcon className="pointer-events-none absolute -bottom-4 -right-2 h-20 w-20 text-primary opacity-20 transition-transform duration-500 group-hover:scale-110" />
      <div className="relative flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Collezione</p>
          <p className="mt-0.5 text-sm font-black text-white">Badge sbloccati</p>
        </div>
        <p className="font-display text-2xl font-black tabular-nums leading-none text-white">
          {unlocked}<span className="text-sm text-slate-500">/{achievements.length}</span>
        </p>
      </div>
      <div className="relative mt-3 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/5">
          <div className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(255,115,0,0.65)] transition-[width] duration-700" style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-[9px] font-black tabular-nums text-slate-400">{percentage}%</span>
      </div>
    </div>
  );
}
