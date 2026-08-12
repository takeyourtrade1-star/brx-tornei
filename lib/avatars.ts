import {
  Crown,
  Flame,
  Gamepad2,
  Ghost,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface ProfileAvatar {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bgGradient: string;
}

export const GAME_AVATARS: ProfileAvatar[] = [
  { id: 'swords', name: 'Spade', icon: Swords, color: 'text-amber-400', bgGradient: 'from-amber-500/20 to-orange-500/20' },
  { id: 'crown', name: 'Corona', icon: Crown, color: 'text-yellow-300', bgGradient: 'from-yellow-500/20 to-amber-500/20' },
  { id: 'flame', name: 'Fiamma', icon: Flame, color: 'text-orange-400', bgGradient: 'from-orange-500/20 to-red-500/20' },
  { id: 'zap', name: 'Fulmine', icon: Zap, color: 'text-cyan-400', bgGradient: 'from-cyan-500/20 to-blue-500/20' },
  { id: 'skull', name: 'Teschio', icon: Skull, color: 'text-purple-400', bgGradient: 'from-purple-500/20 to-indigo-500/20' },
  { id: 'shield', name: 'Scudo', icon: Shield, color: 'text-blue-400', bgGradient: 'from-blue-500/20 to-cyan-500/20' },
  { id: 'ghost', name: 'Fantasma', icon: Ghost, color: 'text-emerald-400', bgGradient: 'from-emerald-500/20 to-teal-500/20' },
  { id: 'sparkles', name: 'Magia', icon: Sparkles, color: 'text-pink-400', bgGradient: 'from-pink-500/20 to-rose-500/20' },
  { id: 'gamepad', name: 'Joystick', icon: Gamepad2, color: 'text-amber-500', bgGradient: 'from-amber-500/20 to-red-500/20' },
  { id: 'trophy', name: 'Coppa', icon: Trophy, color: 'text-yellow-400', bgGradient: 'from-yellow-500/20 to-amber-600/20' },
];

export const DEFAULT_AVATAR_ID = 'swords';
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
    /* localStorage bloccato o non disponibile */
  }
}
