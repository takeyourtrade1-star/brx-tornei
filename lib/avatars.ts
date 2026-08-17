import type { ComponentType } from 'react';
import {
  CrownAvatarIcon,
  ShieldAvatarIcon,
  SwordsAvatarIcon,
  TrophyAvatarIcon,
} from '@/components/feature/profile/avatars/combat-avatars';
import {
  FlameAvatarIcon,
  GamepadAvatarIcon,
  GhostAvatarIcon,
  SkullAvatarIcon,
  SparklesAvatarIcon,
  ZapAvatarIcon,
} from '@/components/feature/profile/avatars/magic-avatars';

export interface ProfileAvatar {
  id: string;
  name: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
}

export const GAME_AVATARS: ProfileAvatar[] = [
  {
    id: 'crown',
    name: 'Corona Reale',
    subtitle: 'Monarca dei Tornei',
    icon: CrownAvatarIcon,
    color: 'text-amber-300',
    bgGradient: 'from-amber-500/25 to-yellow-600/20',
  },
  {
    id: 'swords',
    name: 'Lame Runiche',
    subtitle: 'Maestro Duellante',
    icon: SwordsAvatarIcon,
    color: 'text-sky-300',
    bgGradient: 'from-sky-500/25 to-slate-700/30',
  },
  {
    id: 'flame',
    name: 'Fenice Infuocata',
    subtitle: 'Spirito Ardente',
    icon: FlameAvatarIcon,
    color: 'text-orange-400',
    bgGradient: 'from-orange-600/30 to-red-700/25',
  },
  {
    id: 'skull',
    name: 'Teschio Spettrale',
    subtitle: 'Negromante Runic',
    icon: SkullAvatarIcon,
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-950/40 to-slate-900/40',
  },
  {
    id: 'zap',
    name: 'Fulmine Plasma',
    subtitle: 'Tempesta Ionica',
    icon: ZapAvatarIcon,
    color: 'text-cyan-300',
    bgGradient: 'from-cyan-500/25 to-blue-600/20',
  },
  {
    id: 'shield',
    name: 'Egida Solare',
    subtitle: 'Guardiano Divino',
    icon: ShieldAvatarIcon,
    color: 'text-amber-400',
    bgGradient: 'from-amber-600/25 to-blue-900/30',
  },
  {
    id: 'ghost',
    name: 'Drago Ombra',
    subtitle: 'Furia delle Ombre',
    icon: GhostAvatarIcon,
    color: 'text-indigo-300',
    bgGradient: 'from-indigo-950/50 via-slate-900 to-black',
  },
  {
    id: 'sparkles',
    name: 'Sfera Arcana',
    subtitle: 'Mago Cosmico',
    icon: SparklesAvatarIcon,
    color: 'text-fuchsia-300',
    bgGradient: 'from-fuchsia-600/25 to-purple-800/25',
  },
  {
    id: 'gamepad',
    name: 'Carte Duellante',
    subtitle: 'Asso Olografico',
    icon: GamepadAvatarIcon,
    color: 'text-amber-300',
    bgGradient: 'from-amber-950/40 via-slate-900 to-black',
  },
  {
    id: 'trophy',
    name: 'Calice Trionfale',
    subtitle: 'Campione Supremo',
    icon: TrophyAvatarIcon,
    color: 'text-yellow-300',
    bgGradient: 'from-yellow-500/25 to-amber-700/25',
  },
];

export const DEFAULT_AVATAR_ID = 'crown';
const STORAGE_KEY = 'ebartex_profile_avatar';

export function getAvatarById(id?: string): ProfileAvatar {
  return GAME_AVATARS.find((a) => a.id === id) ?? GAME_AVATARS[0];
}

export function getSavedAvatarId(): string {
  if (typeof window === 'undefined') return DEFAULT_AVATAR_ID;
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_AVATAR_ID;
  } catch {
    return DEFAULT_AVATAR_ID;
  }
}

export function saveAvatarId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent('ebartex-avatar-changed', { detail: { avatarId: id } }));
  } catch {
    /* localStorage non disponibile */
  }
}

/** Restituisce l'avatar impostato per l'utente, oppure un avatar stabile per l'avversario. */
export function getAvatarForPlayer(username: string, isMe?: boolean): ProfileAvatar {
  if (isMe) return getAvatarById(getSavedAvatarId());
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % GAME_AVATARS.length;
  return GAME_AVATARS[idx] ?? GAME_AVATARS[0];
}
