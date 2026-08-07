import type { LucideIcon } from 'lucide-react';
import {
  Crown,
  Flame,
  HeartHandshake,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import type { ReputationSummary } from '@/lib/data/player-api-client';

/** Tono cromatico del badge: scala "carta" che va dal comune al leggendario. */
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tier: AchievementTier;
  /** Valuta se lo sbocco; `stats` sono i contatori aggregati. */
  unlocked: (r: ReputationSummary) => boolean;
  /** Progressione numerica (es. 2/10): se presente la mostriamo sotto il titolo. */
  progress?: (r: ReputationSummary) => { current: number; target: number };
}

const decisiveness = (r: ReputationSummary): number => r.wins + r.losses;

const winRate = (r: ReputationSummary): number => {
  const decided = decisiveness(r);
  return decided > 0 ? r.wins / decided : 0;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-win',
    title: 'Primo sangue',
    description: 'Vinci la tua prima partita.',
    icon: Sparkles,
    tier: 'bronze',
    unlocked: (r) => r.wins >= 1,
  },
  {
    id: 'first-loss',
    title: 'Si impara cadendo',
    description: 'Perdi la tua prima partita: serve per crescere.',
    icon: RotateCcw,
    tier: 'bronze',
    unlocked: (r) => r.losses >= 1,
  },
  {
    id: 'ten-games',
    title: 'Presenza costante',
    description: 'Completa 10 partite.',
    icon: Target,
    tier: 'silver',
    unlocked: (r) => r.played >= 10,
    progress: (r) => ({ current: r.played, target: 10 }),
  },
  {
    id: 'ten-wins',
    title: 'Dieci vittorie',
    description: 'Arriva a 10 vittorie totali.',
    icon: Trophy,
    tier: 'silver',
    unlocked: (r) => r.wins >= 10,
    progress: (r) => ({ current: r.wins, target: 10 }),
  },
  {
    id: 'fifty-wins',
    title: 'Cinquantenario',
    description: 'Leggendario: 50 vittorie sui tornei.',
    icon: Crown,
    tier: 'legendary',
    unlocked: (r) => r.wins >= 50,
    progress: (r) => ({ current: r.wins, target: 50 }),
  },
  {
    id: 'fair-play',
    title: 'Fair play',
    description: '10 partite concluse senza abbandoni.',
    icon: HeartHandshake,
    tier: 'silver',
    unlocked: (r) => r.played >= 10 && r.abandoned === 0,
    progress: (r) => ({ current: r.played, target: 10 }),
  },
  {
    id: 'sharp-shooter',
    title: 'Mira chirurgica',
    description: 'Winrate del 60%+ con almeno 20 partite.',
    icon: Zap,
    tier: 'gold',
    unlocked: (r) => r.played >= 20 && winRate(r) >= 0.6,
    progress: (r) => ({ current: Math.min(20, r.played), target: 20 }),
  },
  {
    id: 'hot-streak',
    title: 'Serie calda',
    description: '5 vittorie consecutive (considera il totale).',
    icon: Flame,
    tier: 'gold',
    unlocked: (r) => r.wins >= 5,
    progress: (r) => ({ current: Math.min(5, r.wins), target: 5 }),
  },
  {
    id: 'veteran',
    title: 'Veterano dei tornei',
    description: '100 partite disputate.',
    icon: Shield,
    tier: 'legendary',
    unlocked: (r) => r.played >= 100,
    progress: (r) => ({ current: r.played, target: 100 }),
  },
  {
    id: 'star-of-bridge',
    title: 'Stella del ponte',
    description: '25 vittorie: un faro per la community.',
    icon: Star,
    tier: 'gold',
    unlocked: (r) => r.wins >= 25,
    progress: (r) => ({ current: r.wins, target: 25 }),
  },
  {
    id: 'swords-duellist',
    title: 'Duellante',
    description: 'Fatti valere: gioca 30 partite.',
    icon: Swords,
    tier: 'silver',
    unlocked: (r) => r.played >= 30,
    progress: (r) => ({ current: r.played, target: 30 }),
  },
];

export interface EvaluatedAchievement extends Omit<AchievementDef, 'progress'> {
  unlockedNow: boolean;
  progress?: { current: number; target: number };
}

/** Stato sblocco di tutti gli achievement su una reputazione. */
export function evaluateAchievements(r: ReputationSummary): EvaluatedAchievement[] {
  return ACHIEVEMENTS.map((def) => {
    const { progress, ...rest } = def;
    return {
      ...rest,
      unlockedNow: def.unlocked(r),
      progress: progress?.(r),
    };
  });
}

/** Riepilogo sintetico per il badge chip in header / profilo. */
export function unlockedCount(r: ReputationSummary): { unlocked: number; total: number } {
  const list = evaluateAchievements(r);
  return {
    unlocked: list.filter((a) => a.unlockedNow).length,
    total: list.length,
  };
}
