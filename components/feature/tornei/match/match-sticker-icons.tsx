import { cn } from '@/lib/utils';
import { MatchStickerSpecialIcon } from './match-sticker-special-icons';

export type StickerId =
  | 'fire'
  | 'brain'
  | 'rip'
  | 'clown'
  | 'salt'
  | 'topdeck'
  | 'ez'
  | 'tilt'
  | 'crown'
  | 'freeze';

interface MatchStickerIconProps {
  id: string;
  className?: string;
  size?: number | string;
}

export function MatchStickerIcon({ id, className, size }: MatchStickerIconProps) {
  const style = size ? { width: size, height: size } : undefined;

  switch (id) {
    case 'fire':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={cn('h-full w-full', className)} style={style}>
          <defs>
            <linearGradient id="fireGrad" x1="24" y1="44" x2="24" y2="4" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF1E00" />
              <stop offset="40%" stopColor="#FF7300" />
              <stop offset="85%" stopColor="#FFD000" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
            <linearGradient id="fireInner" x1="24" y1="40" x2="24" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF7300" />
              <stop offset="70%" stopColor="#FFE600" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
            <filter id="fireGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FF7300" floodOpacity="0.8" />
            </filter>
          </defs>
          <path
            d="M24 4C24 4 28 12 25 18C29 14 34 16 35 22C37 19 38 16 37 12C41 18 43 25 41 32C38 40 31 44 24 44C16 44 9 39 7 32C5 24 9 16 15 10C14 15 17 19 20 20C19 15 21 8 24 4Z"
            fill="url(#fireGrad)"
            filter="url(#fireGlow)"
          />
          <path
            d="M24 20C24 20 27 25 25 29C28 26 31 28 31 32C31 37 27 40 24 40C20 40 17 37 17 32C17 26 21 23 24 20Z"
            fill="url(#fireInner)"
          />
        </svg>
      );

    case 'brain':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={cn('h-full w-full', className)} style={style}>
          <defs>
            <linearGradient id="brainGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <filter id="brainGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00F0FF" floodOpacity="0.8" />
            </filter>
          </defs>
          <path
            d="M24 8C20 8 16 11 16 15C13 15 10 18 10 22C8 25 9 29 11 32C9 35 11 39 15 40C18 41 21 39 23 37L24 37L25 37C27 39 30 41 33 40C37 39 39 35 37 32C39 29 40 25 38 22C38 18 35 15 32 15C32 11 28 8 24 8Z"
            fill="url(#brainGrad)"
            filter="url(#brainGlow)"
          />
          <path d="M24 12V34M17 20C21 22 21 26 24 26C27 26 27 22 31 20M15 30C19 31 20 28 24 28C28 28 29 31 33 30" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          <circle cx="17" cy="20" r="2" fill="#FFFFFF" />
          <circle cx="31" cy="20" r="2" fill="#FFFFFF" />
          <circle cx="24" cy="26" r="2.5" fill="#FFE600" />
        </svg>
      );

    case 'rip':
    case 'skull':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={cn('h-full w-full', className)} style={style}>
          <defs>
            <linearGradient id="skullGrad" x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="60%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <filter id="skullGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#CBD5E1" floodOpacity="0.6" />
            </filter>
          </defs>
          <path
            d="M24 6C14 6 8 14 8 23C8 28 11 32 15 34V40C15 41 16 42 17 42H31C32 42 33 41 33 40V34C37 32 40 28 40 23C40 14 34 6 24 6Z"
            fill="url(#skullGrad)"
            filter="url(#skullGlow)"
          />
          <path d="M14 20L20 26M20 20L14 26" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M28 20L34 26M34 20L28 26" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M24 29L22 33H26L24 29Z" fill="#0F172A" />
          <path d="M19 38V42M24 38V42M29 38V42" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'clown':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={cn('h-full w-full', className)} style={style}>
          <defs>
            <linearGradient id="clownHair" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <filter id="clownNoseGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#EF4444" floodOpacity="0.9" />
            </filter>
          </defs>
          <circle cx="8" cy="22" r="7" fill="url(#clownHair)" />
          <circle cx="40" cy="22" r="7" fill="url(#clownHair)" />
          <circle cx="24" cy="24" r="16" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
          <path d="M17 14L19 19H15L17 14ZM17 24L15 19H19L17 24Z" fill="#3B82F6" />
          <path d="M31 14L33 19H29L31 14ZM31 24L29 19H33L31 24Z" fill="#3B82F6" />
          <circle cx="17" cy="19" r="2" fill="#0F172A" />
          <circle cx="31" cy="19" r="2" fill="#0F172A" />
          <circle cx="24" cy="26" r="5" fill="#EF4444" filter="url(#clownNoseGlow)" />
          <path d="M14 30C16 37 32 37 34 30" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M12 30C13 32 15 31 16 29M36 30C35 32 33 31 32 29" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'salt':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={cn('h-full w-full', className)} style={style}>
          <defs>
            <linearGradient id="saltBody" x1="16" y1="10" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.8" />
            </linearGradient>
            <filter id="saltGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38BDF8" floodOpacity="0.7" />
            </filter>
          </defs>
          <g transform="rotate(-35 24 24)" filter="url(#saltGlow)">
            <path d="M20 8H28V14H20V8Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="22" cy="11" r="0.75" fill="#475569" />
            <circle cx="24" cy="11" r="0.75" fill="#475569" />
            <circle cx="26" cy="11" r="0.75" fill="#475569" />
            <path d="M18 14H30L33 34C33 36 31 38 29 38H19C17 38 15 36 15 34L18 14Z" fill="url(#saltBody)" stroke="#E2E8F0" strokeWidth="2" />
            <path d="M17 22H31L32 34C32 35 30 36 29 36H19C18 36 16 35 16 34L17 22Z" fill="#FFFFFF" opacity="0.9" />
          </g>
          <circle cx="34" cy="36" r="1.5" fill="#FFFFFF" />
          <circle cx="38" cy="40" r="2" fill="#FFFFFF" />
          <circle cx="42" cy="35" r="1.5" fill="#FFFFFF" />
          <circle cx="39" cy="45" r="1.2" fill="#38BDF8" />
        </svg>
      );

    case 'topdeck':
    case 'lucky':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={cn('h-full w-full', className)} style={style}>
          <defs>
            <linearGradient id="goldCard" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="40%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <filter id="topdeckGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#F59E0B" floodOpacity="0.9" />
            </filter>
          </defs>
          <rect x="13" y="7" width="22" height="34" rx="3.5" fill="url(#goldCard)" stroke="#FDE68A" strokeWidth="2" filter="url(#topdeckGlow)" />
          <circle cx="24" cy="24" r="7" fill="#10B981" />
          <path d="M24 19C25 17 27 17 27 19C27 21 24 24 24 24C24 24 21 21 21 19C21 17 23 17 24 19Z" fill="#34D399" />
          <path d="M24 29C25 31 27 31 27 29C27 27 24 24 24 24C24 24 21 27 21 29C21 31 23 31 24 29Z" fill="#34D399" />
          <path d="M19 24C17 25 17 27 19 27C21 27 24 24 24 24C24 24 21 21 19 21C17 21 17 23 19 24Z" fill="#34D399" />
          <path d="M29 24C31 25 31 27 29 27C27 27 24 24 24 24C24 24 27 21 29 21C31 21 31 23 29 24Z" fill="#34D399" />
          <path d="M15 10L17 12M33 38L31 36M33 10L31 12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'ez':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={cn('h-full w-full', className)} style={style}>
          <defs>
            <linearGradient id="teaGrad" x1="10" y1="18" x2="34" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <filter id="ezGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.7" />
            </filter>
          </defs>
          <path d="M10 20H32V32C32 37 27 40 21 40C15 40 10 37 10 32V20Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
          <path d="M32 23C36 23 38 26 38 29C38 32 36 35 32 35" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
          <path d="M12 23H30V31C30 35 26 38 21 38C16 38 12 35 12 31V23Z" fill="url(#teaGrad)" />
          <path d="M16 16C15 12 18 10 16 6M22 15C21 11 24 9 22 5M28 16C27 12 30 10 28 6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <g filter="url(#ezGlow)">
            <rect x="13" y="24" width="7" height="4.5" rx="1" fill="#0F172A" />
            <rect x="22" y="24" width="7" height="4.5" rx="1" fill="#0F172A" />
            <rect x="20" y="25" width="2" height="1.5" fill="#0F172A" />
            <rect x="14" y="25" width="2" height="1.5" fill="#FFFFFF" />
            <rect x="23" y="25" width="2" height="1.5" fill="#FFFFFF" />
          </g>
        </svg>
      );

    case 'tilt':
    case 'rage':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={cn('h-full w-full', className)} style={style}>
          <defs>
            <linearGradient id="bombGrad" x1="12" y1="14" x2="36" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="60%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <filter id="fuseGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#EF4444" floodOpacity="0.9" />
            </filter>
          </defs>
          <circle cx="24" cy="27" r="14" fill="url(#bombGrad)" stroke="#64748B" strokeWidth="2" />
          <path d="M16 20C18 17 21 16 24 16" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="20" y="10" width="8" height="4" rx="1" fill="#64748B" />
          <path d="M24 10C24 6 29 7 30 3" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
          <g filter="url(#fuseGlow)">
            <circle cx="31" cy="3" r="3.5" fill="#EF4444" />
            <circle cx="31" cy="3" r="1.8" fill="#FDE047" />
            <path d="M31 -1V-3M35 3H37M34 0L36 -2M28 0L26 -2" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'crown':
    case 'king':
    case 'freeze':
    case 'ice':
    case 'chill':
      return <MatchStickerSpecialIcon id={id} className={className} size={size} />;

    default:
      return null;
  }
}
