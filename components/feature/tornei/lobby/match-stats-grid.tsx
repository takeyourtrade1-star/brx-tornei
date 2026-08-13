'use client';

import {
  Clock,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Swords,
  Timer,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';

interface StatTile {
  id: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
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
      icon: Trophy,
    },
    {
      id: 'winrate',
      label: 'Win Rate',
      value: `${winRate}%`,
      icon: TrendingUp,
    },
    {
      id: 'streak',
      label: 'Striscia Record',
      value: longestStreak,
      icon: Flame,
    },
    {
      id: 'played',
      label: 'Partite Giocate',
      value: stats.played,
      icon: Swords,
    },
    {
      id: 'time',
      label: 'Tempo di Gioco',
      value: formatTotalTime(totalSeconds),
      icon: Clock,
    },
    {
      id: 'avg_time',
      label: 'Durata Media',
      value: formatAvgTime(avgSeconds),
      icon: Timer,
    },
    {
      id: 'losses',
      label: 'Sconfitte',
      value: stats.losses,
      icon: ShieldAlert,
    },
    {
      id: 'fairplay',
      label: 'Fair Play',
      value: `${fairPlayRate}%`,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4.5">
      {tiles.map((tile) => (
        <StatBadgeCard key={tile.id} tile={tile} />
      ))}
    </div>
  );
}

function StatBadgeCard({ tile }: { tile: StatTile }) {
  const Icon = tile.icon;
  return (
    <div className="group relative flex min-h-[125px] flex-col items-center justify-between overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900/90 via-header-bg/95 to-slate-950 p-4 text-center text-white shadow-xl shadow-slate-950/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-500/15">
      {/* Texture e alone pergamena/carta Hearthstone */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,180,50,0.14),transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
        aria-hidden
      />

      {/* Medaglione icona */}
      <div className="relative mb-2 grid h-11 w-11 place-items-center rounded-2xl border border-amber-400/30 bg-gradient-to-b from-amber-500/20 via-amber-900/25 to-black/60 text-amber-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]" />
      </div>

      {/* Valore numerico Hearthstone */}
      <span className="font-display text-2xl font-black tabular-nums tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:text-3xl">
        {tile.value}
      </span>

      {/* Etichetta */}
      <span className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-200/80">
        {tile.label}
      </span>
    </div>
  );
}
