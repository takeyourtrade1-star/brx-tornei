import type { ComponentType } from 'react';
import type { MatchBadgeId } from '@/lib/validations/match-feedback';
import {
  CreativeGeniusBadgeIcon,
  FastPlayBadgeIcon,
  FriendlyBadgeIcon,
  FunnyBadgeIcon,
  GreatPlayerBadgeIcon,
  KindBadgeIcon,
  MentorBadgeIcon,
  SportiveBadgeIcon,
  StrategistBadgeIcon,
  TableLegendBadgeIcon,
} from './honor-badge-icons-positive';
import {
  ArrogantBadgeIcon,
  LaggyBadgeIcon,
  OffensiveBadgeIcon,
  StallerBadgeIcon,
  UnfairBadgeIcon,
} from './honor-badge-icons-negative';

/**
 * Mappa badge → icona animata, condivisa tra il picker post-partita e la
 * sezione "Valutazioni In-Game" di /partite.
 */
export const BADGE_ICONS: Record<MatchBadgeId, ComponentType<{ className?: string }>> = {
  friendly: FriendlyBadgeIcon,
  kind: KindBadgeIcon,
  great_player: GreatPlayerBadgeIcon,
  sportive: SportiveBadgeIcon,
  strategist: StrategistBadgeIcon,
  creative_genius: CreativeGeniusBadgeIcon,
  fast_play: FastPlayBadgeIcon,
  mentor: MentorBadgeIcon,
  funny: FunnyBadgeIcon,
  table_legend: TableLegendBadgeIcon,
  offensive: OffensiveBadgeIcon,
  unfair: UnfairBadgeIcon,
  laggy: LaggyBadgeIcon,
  staller: StallerBadgeIcon,
  arrogant: ArrogantBadgeIcon,
};

export interface BadgeTone {
  /** Colore dell'icona. */
  icon: string;
  /** Anello/bordo quando il chip è selezionato. */
  ring: string;
  /** Medaglione in /partite. */
  medal: string;
}

/** Toni personali per ciascun titolo: ogni badge ha la sua identità cromatica. */
export const BADGE_TONES: Record<MatchBadgeId, BadgeTone> = {
  friendly: { icon: 'text-emerald-300', ring: 'border-emerald-300/70 bg-emerald-300/15', medal: 'border-emerald-300/35 bg-emerald-300/10' },
  kind: { icon: 'text-rose-300', ring: 'border-rose-300/70 bg-rose-300/15', medal: 'border-rose-300/35 bg-rose-300/10' },
  great_player: { icon: 'text-marquee', ring: 'border-marquee/70 bg-marquee/15', medal: 'border-marquee/35 bg-marquee/10' },
  sportive: { icon: 'text-teal-300', ring: 'border-teal-300/70 bg-teal-300/15', medal: 'border-teal-300/35 bg-teal-300/10' },
  strategist: { icon: 'text-sky-300', ring: 'border-sky-300/70 bg-sky-300/15', medal: 'border-sky-300/35 bg-sky-300/10' },
  creative_genius: { icon: 'text-amber-300', ring: 'border-amber-300/70 bg-amber-300/15', medal: 'border-amber-300/35 bg-amber-300/10' },
  fast_play: { icon: 'text-cyan-300', ring: 'border-cyan-300/70 bg-cyan-300/15', medal: 'border-cyan-300/35 bg-cyan-300/10' },
  mentor: { icon: 'text-violet-300', ring: 'border-violet-300/70 bg-violet-300/15', medal: 'border-violet-300/35 bg-violet-300/10' },
  funny: { icon: 'text-orange-300', ring: 'border-orange-300/70 bg-orange-300/15', medal: 'border-orange-300/35 bg-orange-300/10' },
  table_legend: { icon: 'text-amber-200', ring: 'border-amber-200/70 bg-amber-200/15', medal: 'border-amber-200/35 bg-amber-200/10' },
  offensive: { icon: 'text-rose-400', ring: 'border-rose-400/70 bg-rose-400/15', medal: 'border-rose-400/30 bg-rose-400/10' },
  unfair: { icon: 'text-red-300', ring: 'border-red-300/70 bg-red-300/15', medal: 'border-red-300/30 bg-red-300/10' },
  laggy: { icon: 'text-slate-300', ring: 'border-slate-300/70 bg-slate-300/15', medal: 'border-slate-300/30 bg-slate-300/10' },
  staller: { icon: 'text-zinc-300', ring: 'border-zinc-300/70 bg-zinc-300/15', medal: 'border-zinc-300/30 bg-zinc-300/10' },
  arrogant: { icon: 'text-fuchsia-300', ring: 'border-fuchsia-300/70 bg-fuchsia-300/15', medal: 'border-fuchsia-300/30 bg-fuchsia-300/10' },
};
