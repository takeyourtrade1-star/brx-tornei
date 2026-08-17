import type { ComponentType } from 'react';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { ClashingSwordsIcon } from '@/components/feature/tornei/lobby/clashing-swords-icon';
import { cn } from '@/lib/utils';
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
        <StatBadgeCard key={tile.id} tile={tile} />
      ))}
    </div>
  );
}

function StatBadgeCard({ tile }: { tile: StatTile }) {
  const Icon = tile.Icon;
  return (
    <div className="group relative flex min-h-[96px] sm:min-h-[104px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-3.5 sm:p-4 shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-900/90">
      {/* Riflesso superiore sottile */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      {/* Bagliore cromatico morbido sul fondo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-75"
        style={{ background: `radial-gradient(circle at 85% 85%, ${tile.bgGlow}, transparent 70%)` }}
      />

      {/* Icona Full-Card sfumata e ben visibile in filigrana */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-2 -right-2 h-20 w-20 sm:h-24 sm:w-24 opacity-30 transition-all duration-300 group-hover:scale-110 group-hover:opacity-45 [mask-image:radial-gradient(circle_at_center,black_50%,transparent_90%)]"
      >
        <Icon className={cn('h-full w-full', tile.iconColor)} />
      </div>

      {/* Intestazione tile: solo etichetta in alto */}
      <div className="relative flex items-center justify-between">
        <span className={cn('text-[9px] sm:text-[10px] font-black uppercase tracking-wider', tile.iconColor)}>
          {tile.label}
        </span>
      </div>

      {/* Valore numerico in primo piano */}
      <div className="relative mt-2">
        <span className="font-display text-2xl font-black tabular-nums tracking-tight text-white sm:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {tile.value}
        </span>
      </div>
    </div>
  );
}
