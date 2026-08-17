/**
 * Gestione dei gradi (Rank) e delle stelle di reputazione per i tornei.
 * Si parte da 1★ (Recluta) e si guadagna +1★ ogni 5 vittorie, fino al grado massimo.
 */

export const MAX_RANK_STARS = 5;

/** Calcola il numero di stelle di grado in base alle vittorie complessive (1..5). */
export function rankStarsForWins(wins: number, maxStars = MAX_RANK_STARS): number {
  return Math.min(maxStars, 1 + Math.floor(Math.max(0, wins) / 5));
}

export type RankTierId = 'rookie' | 'fighter' | 'champion' | 'master' | 'legend';

export interface RankTierInfo {
  id: RankTierId;
  name: string;
  minWins: number;
  stars: number;
  ringBorderColor: string;
  ringGlowColor: string;
}

/** Informazioni di tiering per styling e presentazioni grafiche. */
export function getRankTierInfo(wins: number): RankTierInfo {
  const safeWins = Math.max(0, wins);
  const stars = rankStarsForWins(safeWins);

  if (safeWins >= 50) {
    return {
      id: 'legend',
      name: 'Leggenda',
      minWins: 50,
      stars,
      ringBorderColor: 'border-amber-400',
      ringGlowColor: 'shadow-[0_0_24px_rgba(251,191,36,0.55)]',
    };
  }
  if (safeWins >= 25) {
    return {
      id: 'master',
      name: 'Maestro',
      minWins: 25,
      stars,
      ringBorderColor: 'border-amber-400/90',
      ringGlowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.45)]',
    };
  }
  if (safeWins >= 10) {
    return {
      id: 'champion',
      name: 'Campione',
      minWins: 10,
      stars,
      ringBorderColor: 'border-amber-400/80',
      ringGlowColor: 'shadow-[0_0_18px_rgba(245,158,11,0.35)]',
    };
  }
  if (safeWins >= 5) {
    return {
      id: 'fighter',
      name: 'Combattente',
      minWins: 5,
      stars,
      ringBorderColor: 'border-amber-400/70',
      ringGlowColor: 'shadow-[0_0_16px_rgba(245,158,11,0.3)]',
    };
  }
  return {
    id: 'rookie',
    name: 'Recluta',
    minWins: 0,
    stars,
    ringBorderColor: 'border-amber-400/60',
    ringGlowColor: 'shadow-[0_0_14px_rgba(245,158,11,0.25)]',
  };
}
