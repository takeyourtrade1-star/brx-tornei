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
  accentBar: string;
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
 * Griglia statistiche con card a sfondo chiaro e icone full-card sfumate in filigrana.
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
      iconColor: 'text-amber-500',
      accentBar: 'bg-amber-500',
      bgGlow: 'rgba(245,158,11,0.18)',
    },
    {
      id: 'winrate',
      label: 'Win Rate',
      value: `${winRate}%`,
      Icon: CrystalStatIcon,
      iconColor: 'text-primary',
      accentBar: 'bg-primary',
      bgGlow: 'rgba(255,115,0,0.18)',
    },
    {
      id: 'streak',
      label: 'Striscia Record',
      value: longestStreak,
      Icon: FlameStatIcon,
      iconColor: 'text-orange-500',
      accentBar: 'bg-orange-500',
      bgGlow: 'rgba(249,115,22,0.18)',
    },
    {
      id: 'played',
      label: 'Partite Giocate',
      value: stats.played,
      Icon: ClashingSwordsIcon,
      iconColor: 'text-sky-500',
      accentBar: 'bg-sky-500',
      bgGlow: 'rgba(14,165,233,0.18)',
    },
    {
      id: 'time',
      label: 'Tempo di Gioco',
      value: formatTotalTime(totalSeconds),
      Icon: HourglassStatIcon,
      iconColor: 'text-cyan-500',
      accentBar: 'bg-cyan-500',
      bgGlow: 'rgba(6,182,212,0.18)',
    },
    {
      id: 'avg_time',
      label: 'Durata Media',
      value: formatAvgTime(avgSeconds),
      Icon: WatchStatIcon,
      iconColor: 'text-indigo-500',
      accentBar: 'bg-indigo-500',
      bgGlow: 'rgba(99,102,241,0.18)',
    },
    {
      id: 'losses',
      label: 'Sconfitte',
      value: stats.losses,
      Icon: SkullStatIcon,
      iconColor: 'text-rose-500',
      accentBar: 'bg-rose-500',
      bgGlow: 'rgba(244,63,94,0.18)',
    },
    {
      id: 'fairplay',
      label: 'Fair Play',
      value: `${fairPlayRate}%`,
      Icon: ShieldStatIcon,
      iconColor: 'text-teal-500',
      accentBar: 'bg-teal-500',
      bgGlow: 'rgba(20,184,166,0.18)',
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
    <div className="group relative flex min-h-[96px] sm:min-h-[104px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {/* Sfumatura di sfondo morbida a gradiente */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-75"
        style={{ background: `radial-gradient(circle at 85% 85%, ${tile.bgGlow}, transparent 70%)` }}
      />

      {/* Icona Full-Card a sfondo filigrana sfumata verso l'esterno */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 sm:h-24 sm:w-24 opacity-[0.16] transition-all duration-300 group-hover:scale-110 group-hover:opacity-28 [mask-image:radial-gradient(circle_at_center,black_45%,transparent_85%)]"
      >
        <Icon className={cn('h-full w-full', tile.iconColor)} />
      </div>

      {/* Intestazione tile: accento e label */}
      <div className="relative flex items-center justify-between gap-2">
        <span className={cn('h-1.5 w-6 rounded-full', tile.accentBar)} />
        <span className={cn('text-[9px] sm:text-[10px] font-black uppercase tracking-wider', tile.iconColor)}>
          {tile.label}
        </span>
      </div>

      {/* Valore numerico in primo piano */}
      <div className="relative mt-2">
        <span className="font-display text-2xl font-black tabular-nums tracking-tight text-slate-900 sm:text-3xl">
          {tile.value}
        </span>
      </div>
    </div>
  );
}
