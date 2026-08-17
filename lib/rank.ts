import type { ReputationSummary } from '@/lib/data/player-api-client';

/**
 * Gestione dei gradi (Rank), leghe e stelle di reputazione per i tornei.
 * Le stelline riflettono le vittorie giornaliere (reset ogni 24h).
 * Con 3+ vittorie consecutive si attiva la modalità "ON FIRE" 🔥.
 */

export const MAX_RANK_STARS = 5;

export interface LeagueTier {
  stars: number;
  name: string;
  badgeColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
}

export const LEAGUES: LeagueTier[] = [
  {
    stars: 1,
    name: 'Bronzo',
    badgeColor: 'text-amber-600',
    borderColor: 'border-amber-700/60',
    glowColor: 'shadow-[0_0_12px_rgba(180,83,9,0.3)]',
    description: 'Grado base: inizia a duellare e conquista la prima vittoria.',
  },
  {
    stars: 2,
    name: 'Argento',
    badgeColor: 'text-slate-300',
    borderColor: 'border-slate-300/80',
    glowColor: 'shadow-[0_0_14px_rgba(203,213,225,0.4)]',
    description: 'Combattente: 1 vittoria giornaliera conquistata.',
  },
  {
    stars: 3,
    name: 'Oro',
    badgeColor: 'text-amber-300',
    borderColor: 'border-amber-400',
    glowColor: 'shadow-[0_0_18px_rgba(245,158,11,0.45)]',
    description: 'Campione: 2 vittorie giornaliere.',
  },
  {
    stars: 4,
    name: 'Platino',
    badgeColor: 'text-cyan-300',
    borderColor: 'border-cyan-400',
    glowColor: 'shadow-[0_0_20px_rgba(34,211,238,0.5)]',
    description: 'Maestro: 3 vittorie giornaliere. Streak elevata.',
  },
  {
    stars: 5,
    name: 'Diamante',
    badgeColor: 'text-violet-300',
    borderColor: 'border-violet-400',
    glowColor: 'shadow-[0_0_24px_rgba(168,85,247,0.6)]',
    description: 'Leggenda: 4+ vittorie giornaliere. Vertice della classifica.',
  },
];

/** Calcola le vittorie nelle ultime 24 ore dal registro partite. */
export function calculateDailyWins(reputation?: ReputationSummary | null): number {
  if (!reputation) return 0;
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const matches = reputation.history?.length ? reputation.history : reputation.recent;

  if (!matches || matches.length === 0) {
    return Math.min(reputation.wins, 5);
  }

  const dailyCount = matches.filter((m) => {
    if (m.outcome !== 'win') return false;
    if (!m.createdAt) return true;
    const matchTime = new Date(m.createdAt).getTime();
    return !isNaN(matchTime) && now - matchTime < oneDayMs;
  }).length;

  return dailyCount;
}

/** Calcola la serie di vittorie consecutive attuale (Win Streak). */
export function calculateWinStreak(reputation?: ReputationSummary | null): number {
  if (!reputation) return 0;
  const matches = reputation.recent ?? [];
  if (!matches.length) return 0;

  let streak = 0;
  for (const match of matches) {
    if (match.outcome === 'win') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Calcola il numero di stelle (1..5) in base alle vittorie giornaliere. */
export function rankStarsForWins(dailyWins: number, maxStars = MAX_RANK_STARS): number {
  return Math.max(1, Math.min(maxStars, 1 + Math.max(0, dailyWins)));
}

/** Informazioni sulla Lega di appartenenza per stelle attuali. */
export function getLeagueByStars(stars: number): LeagueTier {
  const safeStars = Math.max(1, Math.min(stars, MAX_RANK_STARS));
  return LEAGUES[safeStars - 1] ?? LEAGUES[0];
}

/** Calcola i punti di un poligono a stella a 5 punte con precisione SVG. */
export function getStarPoints(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  rotationDeg: number = 0,
): string {
  const points: string[] = [];
  const rotRad = (rotationDeg - 90) * (Math.PI / 180);
  for (let i = 0; i < 10; i++) {
    const angle = rotRad + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

/** Calcola gli angoli delle stelle con spaziatura proporzionale e anti-sovrapposizione. */
export function getStarAngles(count: number): number[] {
  const safeCount = Math.max(1, Math.min(count, MAX_RANK_STARS));
  if (safeCount === 1) return [20];
  if (safeCount === 2) return [6, 34];
  if (safeCount === 3) return [-6, 18, 42];
  if (safeCount === 4) return [-14, 4, 23, 42];
  return [-16, -1, 14, 29, 44];
}

/**
 * Corona di fiamme stilizzata, affilata e non sbavata, scolpita verticalmente sopra la stella.
 * Mantiene i contorni puliti e definiti senza fondersi con le stelle adiacenti.
 */
export function getStarFlamePaths(sx: number, sy: number): { outer: string; inner: string } {
  const outer = `M ${(sx - 2.8).toFixed(2)} ${(sy + 1.2).toFixed(2)} C ${(sx - 3.4).toFixed(2)} ${(sy - 1.2).toFixed(2)} ${(sx - 2.6).toFixed(2)} ${(sy - 3.8).toFixed(2)} ${(sx - 1.2).toFixed(2)} ${(sy - 4.4).toFixed(2)} C ${(sx - 1.6).toFixed(2)} ${(sy - 3.2).toFixed(2)} ${(sx - 0.6).toFixed(2)} ${(sy - 4.2).toFixed(2)} ${sx.toFixed(2)} ${(sy - 6.8).toFixed(2)} C ${(sx + 0.6).toFixed(2)} ${(sy - 4.2).toFixed(2)} ${(sx + 1.6).toFixed(2)} ${(sy - 3.2).toFixed(2)} ${(sx + 1.2).toFixed(2)} ${(sy - 4.4).toFixed(2)} C ${(sx + 2.6).toFixed(2)} ${(sy - 3.8).toFixed(2)} ${(sx + 3.4).toFixed(2)} ${(sy - 1.2).toFixed(2)} ${(sx + 2.8).toFixed(2)} ${(sy + 1.2).toFixed(2)} C ${(sx + 1.8).toFixed(2)} ${(sy + 2.2).toFixed(2)} ${(sx - 1.8).toFixed(2)} ${(sy + 2.2).toFixed(2)} ${(sx - 2.8).toFixed(2)} ${(sy + 1.2).toFixed(2)} Z`;

  const inner = `M ${(sx - 1.6).toFixed(2)} ${(sy + 0.8).toFixed(2)} C ${(sx - 2.0).toFixed(2)} ${(sy - 0.8).toFixed(2)} ${(sx - 1.4).toFixed(2)} ${(sy - 2.4).toFixed(2)} ${(sx - 0.6).toFixed(2)} ${(sy - 2.8).toFixed(2)} C ${(sx - 0.9).toFixed(2)} ${(sy - 2.0).toFixed(2)} ${(sx - 0.3).toFixed(2)} ${(sy - 2.6).toFixed(2)} ${sx.toFixed(2)} ${(sy - 4.6).toFixed(2)} C ${(sx + 0.3).toFixed(2)} ${(sy - 2.6).toFixed(2)} ${(sx + 0.9).toFixed(2)} ${(sy - 2.0).toFixed(2)} ${(sx + 0.6).toFixed(2)} ${(sy - 2.8).toFixed(2)} C ${(sx + 1.4).toFixed(2)} ${(sy - 2.4).toFixed(2)} ${(sx + 2.0).toFixed(2)} ${(sy - 0.8).toFixed(2)} ${(sx + 1.6).toFixed(2)} ${(sy + 0.8).toFixed(2)} Z`;

  return { outer, inner };
}
