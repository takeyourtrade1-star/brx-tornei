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
import { StatBadgeCard } from './stat-badge-card';

interface StatTile {
  id: string;
  label: string;
  value: string | number;
  Icon: ComponentType<{ className?: string }>;
  iconColor: string;
  bgGlow: string;
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
 * Griglia statistiche con card scure, icone full-card visibili in filigrana e layout pulito.
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
      iconColor: 'text-amber-400',
      bgGlow: 'rgba(251,191,36,0.22)',
    },
    {
      id: 'winrate',
      label: 'Win Rate',
      value: `${winRate}%`,
      Icon: CrystalStatIcon,
      iconColor: 'text-primary',
      bgGlow: 'rgba(255,115,0,0.22)',
    },
    {
      id: 'streak',
      label: 'Striscia Record',
      value: longestStreak,
      Icon: FlameStatIcon,
      iconColor: 'text-orange-400',
      bgGlow: 'rgba(251,146,60,0.22)',
    },
    {
      id: 'played',
      label: 'Partite Giocate',
      value: stats.played,
      Icon: ClashingSwordsIcon,
      iconColor: 'text-sky-400',
      bgGlow: 'rgba(56,189,248,0.20)',
    },
    {
      id: 'time',
      label: 'Tempo di Gioco',
      value: formatTotalTime(totalSeconds),
      Icon: HourglassStatIcon,
      iconColor: 'text-cyan-400',
      bgGlow: 'rgba(34,211,238,0.20)',
    },
    {
      id: 'avg_time',
      label: 'Durata Media',
      value: formatAvgTime(avgSeconds),
      Icon: WatchStatIcon,
      iconColor: 'text-indigo-400',
      bgGlow: 'rgba(129,140,248,0.20)',
    },
    {
      id: 'losses',
      label: 'Sconfitte',
      value: stats.losses,
      Icon: SkullStatIcon,
      iconColor: 'text-rose-400',
      bgGlow: 'rgba(251,113,133,0.20)',
    },
    {
      id: 'fairplay',
      label: 'Fair Play',
      value: `${fairPlayRate}%`,
      Icon: ShieldStatIcon,
      iconColor: 'text-teal-400',
      bgGlow: 'rgba(45,212,191,0.20)',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
      {tiles.map((tile) => (
        <StatBadgeCard
          key={tile.id}
          label={tile.label}
          value={tile.value}
          Icon={tile.Icon}
          iconColor={tile.iconColor}
          bgGlow={tile.bgGlow}
        />
      ))}
    </div>
  );
}
