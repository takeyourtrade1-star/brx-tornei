import type { ComponentType } from 'react';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { ClashingSwordsIcon } from '@/components/feature/tornei/lobby/clashing-swords-icon';
import {
  CrownStatIcon,
  CrystalStatIcon,
  FlameStatIcon,
  HourglassStatIcon,
  ShieldStatIcon,
  SkullStatIcon,
  WatchStatIcon,
} from './partite-stats-icons';

interface StatTile {
  id: string;
  label: string;
  value: string | number;
  Icon: ComponentType<{ className?: string }>;
  iconColor: string;
  badge: string;
  gem: string;
  ring: string;
  glow: string;
}

function computeLongestStreak(rows: { outcome: string; createdAt: string }[]): number {
  if (!rows || rows.length === 0) return 0;
  const sorted = [...rows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  let maxStreak = 0;
  let currentStreak = 0;
  for (const r of sorted) {
    if (r.outcome === 'win') {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }
  return maxStreak;
}

function computeDurationStats(rows: { durationSeconds: number }[]) {
  let total = 0;
  let count = 0;
  for (const r of rows) {
    if (r.durationSeconds > 0) {
      total += r.durationSeconds;
      count++;
    }
  }
  const avg = count > 0 ? Math.round(total / count) : 0;
  return { total, avg };
}

function formatTotalTime(seconds: number): string {
  if (seconds <= 0) return '0 hrs';
  const hrs = seconds / 3600;
  if (hrs < 1) {
    const mins = Math.max(1, Math.round(seconds / 60));
    return `${mins} min`;
  }
  return `${hrs.toFixed(1)} hrs`;
}

function formatAvgTime(seconds: number): string {
  if (seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * Griglia stats compatta con medaglioni rifiniti e animazioni delicate.
 */
export function PartiteStatsGrid({
  reputation,
}: {
  reputation: ReputationSummaryData | null;
}) {
  const stats: ReputationSummaryData = reputation ?? {
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
  const winRate = decided > 0 ? Math.round((stats.wins / decided) * 100) : 0;
  const fairPlayRate = stats.played > 0 ? Math.round((decided / stats.played) * 100) : 100;
  const longestStreak = computeLongestStreak(rows);
  const { total: totalSeconds, avg: avgSeconds } = computeDurationStats(rows);

  const tiles: StatTile[] = [
    {
      id: 'wins',
      label: 'Vittorie',
      value: stats.wins,
      Icon: CrownStatIcon,
      iconColor: 'text-marquee',
      badge: 'border-marquee/35 bg-marquee/10',
      gem: 'bg-marquee',
      ring: 'border-marquee/10',
      glow: 'rgba(243,199,106,0.12)',
    },
    {
      id: 'winrate',
      label: 'Win Rate',
      value: `${winRate}%`,
      Icon: CrystalStatIcon,
      iconColor: 'text-primary',
      badge: 'border-primary/35 bg-primary/10',
      gem: 'bg-primary',
      ring: 'border-primary/10',
      glow: 'rgba(255,115,0,0.12)',
    },
    {
      id: 'streak',
      label: 'Striscia Record',
      value: longestStreak,
      Icon: FlameStatIcon,
      iconColor: 'text-orange-400',
      badge: 'border-orange-400/30 bg-orange-400/10',
      gem: 'bg-orange-400',
      ring: 'border-orange-400/10',
      glow: 'rgba(251,146,60,0.12)',
    },
    {
      id: 'played',
      label: 'Partite Giocate',
      value: stats.played,
      Icon: ClashingSwordsIcon,
      iconColor: 'text-sky-400',
      badge: 'border-sky-400/30 bg-sky-400/10',
      gem: 'bg-sky-400',
      ring: 'border-sky-400/10',
      glow: 'rgba(56,189,248,0.10)',
    },
    {
      id: 'time',
      label: 'Tempo di Gioco',
      value: formatTotalTime(totalSeconds),
      Icon: HourglassStatIcon,
      iconColor: 'text-cyan-400',
      badge: 'border-cyan-400/30 bg-cyan-400/10',
      gem: 'bg-cyan-400',
      ring: 'border-cyan-400/10',
      glow: 'rgba(34,211,238,0.10)',
    },
    {
      id: 'avg_time',
      label: 'Durata Media',
      value: formatAvgTime(avgSeconds),
      Icon: WatchStatIcon,
      iconColor: 'text-indigo-400',
      badge: 'border-indigo-400/30 bg-indigo-400/10',
      gem: 'bg-indigo-400',
      ring: 'border-indigo-400/10',
      glow: 'rgba(129,140,248,0.10)',
    },
    {
      id: 'losses',
      label: 'Sconfitte',
      value: stats.losses,
      Icon: SkullStatIcon,
      iconColor: 'text-rose-400',
      badge: 'border-rose-400/30 bg-rose-400/10',
      gem: 'bg-rose-400',
      ring: 'border-rose-400/10',
      glow: 'rgba(251,113,133,0.10)',
    },
    {
      id: 'fairplay',
      label: 'Fair Play',
      value: `${fairPlayRate}%`,
      Icon: ShieldStatIcon,
      iconColor: 'text-teal-400',
      badge: 'border-teal-400/30 bg-teal-400/10',
      gem: 'bg-teal-400',
      ring: 'border-teal-400/10',
      glow: 'rgba(45,212,191,0.10)',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
      {tiles.map((tile) => (
        <StatBadgeCard key={tile.id} tile={tile} />
      ))}
    </div>
  );
}

function StatBadgeCard({ tile }: { tile: StatTile }) {
  const Icon = tile.Icon;
  return (
    <div className="group relative flex min-h-[108px] flex-col items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-3 text-center shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-900/80 sm:min-h-[116px]">
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-1 rounded-lg border ${tile.ring}`}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse at top, ${tile.glow}, transparent 70%)` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <span
        className={`relative mb-1.5 grid h-9 w-9 rotate-45 place-items-center rounded-lg border bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${tile.badge}`}
      >
        <Icon className={`h-5 w-5 -rotate-45 ${tile.iconColor}`} />
      </span>

      <span className="relative font-display text-xl font-black tabular-nums tracking-tight text-white sm:text-2xl">
        {tile.value}
      </span>

      <span className="relative mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 transition-colors duration-200 group-hover:text-slate-300">
        {tile.label}
      </span>
    </div>
  );
}
