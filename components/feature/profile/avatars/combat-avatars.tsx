'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarIconProps {
  className?: string;
}

/** Corona Imperiale con rubino centrale, archi d'oro e bagliore regale. */
export function CrownAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`cr-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="30%" stopColor="#FCD34D" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id={`cr-ruby-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FECDD3" />
          <stop offset="40%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>
        <filter id={`cr-glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#F59E0B" floodOpacity="0.8" />
        </filter>
      </defs>
      {/* Cuscino velluto */}
      <path d="M 10 27 Q 20 32 30 27 L 28 31 Q 20 34 12 31 Z" fill="#881337" opacity="0.9" />
      {/* Corpo corona */}
      <path
        d="M 8 28 L 6 15 L 14 21 L 20 10 L 26 21 L 34 15 L 32 28 Q 20 31 8 28 Z"
        fill={`url(#cr-gold-${uid})`}
        stroke="#78350F"
        strokeWidth="0.8"
        filter={`url(#cr-glow-${uid})`}
      />
      {/* Fascia di base dorata con gemme incastonate */}
      <path d="M 8 27 Q 20 30 32 27 L 31.5 30 Q 20 33 8.5 30 Z" fill="#FBBF24" stroke="#92400E" strokeWidth="0.5" />
      <circle cx="13" cy="28.5" r="1" fill="#38BDF8" />
      <circle cx="20" cy="29.8" r="1.3" fill={`url(#cr-ruby-${uid})`} className="animate-pulse" />
      <circle cx="27" cy="28.5" r="1" fill="#38BDF8" />
      {/* Perle sulle punte */}
      <circle cx="6" cy="15" r="1.6" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.4" />
      <circle cx="20" cy="10" r="2.2" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.5" className="animate-pulse" />
      <circle cx="34" cy="15" r="1.6" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.4" />
      {/* Rubino centrale sfaccettato */}
      <polygon points="20,17 23,21 20,25 17,21" fill={`url(#cr-ruby-${uid})`} stroke="#FFE4E6" strokeWidth="0.4" className="animate-pulse" />
    </svg>
  );
}

/** Lame Runiche del Destino: spade incrociate con rune azzurre pulsanti e scintilla. */
export function SwordsAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`sw-steel-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id={`sw-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      {/* Spada 1: Top-Left to Bottom-Right */}
      <g transform="rotate(-45 20 20)">
        <polygon points="18.5,5 20,2 21.5,5 21.5,27 18.5,27" fill={`url(#sw-steel-${uid})`} stroke="#1E293B" strokeWidth="0.5" />
        <line x1="20" y1="5" x2="20" y2="25" stroke="#38BDF8" strokeWidth="0.8" className="animate-pulse" />
        {/* Elsa */}
        <rect x="14" y="27" width="12" height="2.5" rx="1" fill={`url(#sw-gold-${uid})`} stroke="#78350F" strokeWidth="0.5" />
        {/* Impugnatura e Pomo */}
        <rect x="18.8" y="29.5" width="2.4" height="6" rx="0.5" fill="#78350F" />
        <circle cx="20" cy="37" r="2" fill={`url(#sw-gold-${uid})`} stroke="#78350F" strokeWidth="0.5" />
      </g>
      {/* Spada 2: Top-Right to Bottom-Left */}
      <g transform="rotate(45 20 20)">
        <polygon points="18.5,5 20,2 21.5,5 21.5,27 18.5,27" fill={`url(#sw-steel-${uid})`} stroke="#1E293B" strokeWidth="0.5" />
        <line x1="20" y1="5" x2="20" y2="25" stroke="#38BDF8" strokeWidth="0.8" className="animate-pulse" />
        <rect x="14" y="27" width="12" height="2.5" rx="1" fill={`url(#sw-gold-${uid})`} stroke="#78350F" strokeWidth="0.5" />
        <rect x="18.8" y="29.5" width="2.4" height="6" rx="0.5" fill="#78350F" />
        <circle cx="20" cy="37" r="2" fill={`url(#sw-gold-${uid})`} stroke="#78350F" strokeWidth="0.5" />
      </g>
      {/* Scintilla di scontro centrale */}
      <polygon points="20,16 21.5,19 24,20 21.5,21 20,24 18.5,21 16,20 18.5,19" fill="#E0F2FE" className="animate-ping" style={{ transformOrigin: 'center' }} />
    </svg>
  );
}

/** Egida del Guardiano: scudo da cavaliere dorato con leone solare e zaffiro. */
export function ShieldAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`sh-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="80%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
        <linearGradient id={`sh-steel-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
      {/* Raggi solari posteriori */}
      <circle cx="20" cy="20" r="16" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" className="animate-spin" style={{ animationDuration: '14s' }} />
      {/* Sagoma scudo */}
      <path
        d="M 8 7 L 32 7 Q 32 23 20 35 Q 8 23 8 7 Z"
        fill={`url(#sh-steel-${uid})`}
        stroke={`url(#sh-gold-${uid})`}
        strokeWidth="2"
      />
      {/* Bordatura interna dorata */}
      <path d="M 11 10 L 29 10 Q 29 22 20 31 Q 11 22 11 10 Z" fill="none" stroke="#FBBF24" strokeWidth="0.8" opacity="0.6" />
      {/* Emblema Leone Solare */}
      <path d="M 20 12 L 24 16 L 22 21 L 20 19 L 18 21 L 16 16 Z" fill={`url(#sh-gold-${uid})`} />
      <circle cx="20" cy="23" r="3" fill={`url(#sh-gold-${uid})`} />
      <polygon points="20,21 21.5,23.5 20,26 18.5,23.5" fill="#38BDF8" className="animate-pulse" />
    </svg>
  );
}

/** Calice della Vittoria: coppa dorata alata con stella splendente e alloro. */
export function TrophyAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`tr-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="35%" stopColor="#FCD34D" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      {/* Stella di luce superiore */}
      <polygon points="20,3 21.5,6.5 25,8 21.5,9.5 20,13 18.5,9.5 15,8 18.5,6.5" fill="#FEF08A" className="animate-pulse" />
      {/* Manici alati */}
      <path d="M 12 14 Q 5 16 7 24 Q 10 28 14 26" fill="none" stroke={`url(#tr-gold-${uid})`} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 28 14 Q 35 16 33 24 Q 30 28 26 26" fill="none" stroke={`url(#tr-gold-${uid})`} strokeWidth="1.8" strokeLinecap="round" />
      {/* Calice */}
      <path d="M 11 11 L 29 11 L 27 23 Q 20 28 13 23 Z" fill={`url(#tr-gold-${uid})`} stroke="#78350F" strokeWidth="0.8" />
      {/* Stelo e Base */}
      <path d="M 18 26 L 22 26 L 22 31 L 18 31 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="0.5" />
      <path d="M 13 32 L 27 32 L 29 36 L 11 36 Z" fill={`url(#tr-gold-${uid})`} stroke="#78350F" strokeWidth="0.8" />
      {/* Stella centrale incisa */}
      <polygon points="20,15 21,17.5 23.5,18 21.5,19.5 22,22 20,20.5 18,22 18.5,19.5 16.5,18 19,17.5" fill="#FFFBEB" />
    </svg>
  );
}
