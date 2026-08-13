'use client';

import {
  Clock,
  Crown,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Swords,
  Timer,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';

interface StatTile {
  id: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  badgeStyle: string;
  iconColor: string;
  accentGlow: string;
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

export function MatchStatsGrid({ stats }: { stats: ReputationSummaryData }) {
  const rows = stats.history.length > 0 ? stats.history : stats.recent;
  const decided = stats.wins + stats.losses;
  const winRate = decided > 0 ? Math.round((stats.wins / decided) * 100) : 0;
  const fairPlayRate =
    stats.played > 0 ? Math.round((decided / stats.played) * 100) : 100;
  const longestStreak = computeLongestStreak(rows);
  const { total: totalSeconds, avg: avgSeconds } = computeDurationStats(rows);

  const tiles: StatTile[] = [
    {
      id: 'wins',
      label: 'Vittorie',
      value: stats.wins,
      icon: Crown,
      badgeStyle: 'border-emerald-500/30 bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      accentGlow: 'rgba(16,185,129,0.12)',
    },
    {
      id: 'winrate',
      label: 'Win Rate',
      value: `${winRate}%`,
      icon: TrendingUp,
      badgeStyle: 'border-primary/35 bg-primary/10',
      iconColor: 'text-primary',
      accentGlow: 'rgba(255,115,0,0.15)',
    },
    {
      id: 'streak',
      label: 'Striscia Record',
      value: longestStreak,
      icon: Flame,
      badgeStyle: 'border-orange-500/30 bg-orange-500/10',
      iconColor: 'text-orange-400',
      accentGlow: 'rgba(249,115,22,0.14)',
    },
    {
      id: 'played',
      label: 'Partite Giocate',
      value: stats.played,
      icon: Swords,
      badgeStyle: 'border-sky-500/30 bg-sky-500/10',
      iconColor: 'text-sky-400',
      accentGlow: 'rgba(56,189,248,0.12)',
    },
    {
      id: 'time',
      label: 'Tempo di Gioco',
      value: formatTotalTime(totalSeconds),
      icon: Clock,
      badgeStyle: 'border-cyan-500/30 bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      accentGlow: 'rgba(6,182,212,0.12)',
    },
    {
      id: 'avg_time',
      label: 'Durata Media',
      value: formatAvgTime(avgSeconds),
      icon: Timer,
      badgeStyle: 'border-indigo-500/30 bg-indigo-500/10',
      iconColor: 'text-indigo-400',
      accentGlow: 'rgba(99,102,241,0.12)',
    },
    {
      id: 'losses',
      label: 'Sconfitte',
      value: stats.losses,
      icon: ShieldAlert,
      badgeStyle: 'border-rose-500/30 bg-rose-500/10',
      iconColor: 'text-rose-400',
      accentGlow: 'rgba(244,63,94,0.12)',
    },
    {
      id: 'fairplay',
      label: 'Fair Play',
      value: `${fairPlayRate}%`,
      icon: ShieldCheck,
      badgeStyle: 'border-teal-500/30 bg-teal-500/10',
      iconColor: 'text-teal-400',
      accentGlow: 'rgba(20,184,166,0.12)',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {tiles.map((tile) => (
        <StatBadgeCard key={tile.id} tile={tile} />
      ))}
    </div>
  );
}

function StatBadgeCard({ tile }: { tile: StatTile }) {
  const Icon = tile.icon;
  return (
    <div className="group relative flex min-h-[120px] flex-col items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-header-bg/90 p-4 text-center text-white shadow-xl shadow-black/40 backdrop-blur-md transition-colors duration-200 hover:border-white/20 hover:bg-header-bg">
      {/* Soft radial glow accent on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at top, ${tile.accentGlow}, transparent 70%)`,
        }}
        aria-hidden
      />
      {/* Top subtle highlight line */}
      <div
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        aria-hidden
      />

      {/* Icon medallion */}
      <div className={`relative mb-2 grid h-10 w-10 place-items-center rounded-xl border ${tile.badgeStyle} backdrop-blur-sm`}>
        <Icon className={`h-5 w-5 ${tile.iconColor}`} />
      </div>

      {/* Stat value */}
      <span className="font-display text-2xl font-black tabular-nums tracking-tight text-white sm:text-3xl">
        {tile.value}
      </span>

      {/* Stat label */}
      <span className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/55 transition-colors duration-200 group-hover:text-white/80">
        {tile.label}
      </span>
    </div>
  );
}
