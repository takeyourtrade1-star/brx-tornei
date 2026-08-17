'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarIconProps {
  className?: string;
}

/** Corona Imperiale con rubino centrale sfaccettato, perle d'oro e shimmer regale. */
export function CrownAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`cr-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="25%" stopColor="#FCD34D" />
          <stop offset="65%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id={`cr-ruby-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FECDD3" />
          <stop offset="40%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>
        <filter id={`cr-glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#F59E0B" floodOpacity="0.85" />
        </filter>
      </defs>
      {/* Cuscino in velluto */}
      <path d="M 7 28 Q 20 33 33 28 L 31 33 Q 20 36 9 33 Z" fill="#881337" opacity="0.9" />
      {/* Corpo corona ad ampia apertura */}
      <path
        d="M 5 29 L 3 13 L 13 20 L 20 7 L 27 20 L 37 13 L 35 29 Q 20 33 5 29 Z"
        fill={`url(#cr-gold-${uid})`}
        stroke="#78350F"
        strokeWidth="0.9"
        filter={`url(#cr-glow-${uid})`}
      />
      {/* Fascia base dorata con zaffiri e rubino */}
      <path d="M 5 28 Q 20 32 35 28 L 34.5 32 Q 20 35.5 5.5 32 Z" fill="#FBBF24" stroke="#92400E" strokeWidth="0.6" />
      <circle cx="11" cy="30" r="1.3" fill="#38BDF8" />
      <circle cx="20" cy="31.5" r="1.6" fill={`url(#cr-ruby-${uid})`} className="av-anim-ruby" />
      <circle cx="29" cy="30" r="1.3" fill="#38BDF8" />
      {/* Perle sulle punte */}
      <circle cx="3" cy="13" r="1.9" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.5" />
      <circle cx="20" cy="7" r="2.6" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.6" className="av-anim-ruby" />
      <circle cx="37" cy="13" r="1.9" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.5" />
      {/* Rubino centrale a rombo con pulsazione battito */}
      <polygon points="20,15 24,20 20,25 16,20" fill={`url(#cr-ruby-${uid})`} stroke="#FFE4E6" strokeWidth="0.5" className="av-anim-ruby" />
    </svg>
  );
}

/** Lame Runiche del Destino: spade incrociate oversize con scintilla rotante al clash. */
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
      {/* Spada 1 */}
      <g transform="rotate(-45 20 20)">
        <polygon points="18,3 20,0 22,3 22,27 18,27" fill={`url(#sw-steel-${uid})`} stroke="#0F172A" strokeWidth="0.6" />
        <line x1="20" y1="4" x2="20" y2="25" stroke="#38BDF8" strokeWidth="1" />
        <rect x="13" y="27" width="14" height="2.8" rx="1.2" fill={`url(#sw-gold-${uid})`} stroke="#78350F" strokeWidth="0.6" />
        <rect x="18.6" y="29.8" width="2.8" height="6.5" rx="0.6" fill="#78350F" />
        <circle cx="20" cy="38" r="2.3" fill={`url(#sw-gold-${uid})`} stroke="#78350F" strokeWidth="0.6" />
      </g>
      {/* Spada 2 */}
      <g transform="rotate(45 20 20)">
        <polygon points="18,3 20,0 22,3 22,27 18,27" fill={`url(#sw-steel-${uid})`} stroke="#0F172A" strokeWidth="0.6" />
        <line x1="20" y1="4" x2="20" y2="25" stroke="#38BDF8" strokeWidth="1" />
        <rect x="13" y="27" width="14" height="2.8" rx="1.2" fill={`url(#sw-gold-${uid})`} stroke="#78350F" strokeWidth="0.6" />
        <rect x="18.6" y="29.8" width="2.8" height="6.5" rx="0.6" fill="#78350F" />
        <circle cx="20" cy="38" r="2.3" fill={`url(#sw-gold-${uid})`} stroke="#78350F" strokeWidth="0.6" />
      </g>
      {/* Scintilla centrale di scontro animata */}
      <polygon points="20,14 22,19 27,20 22,21 20,26 18,21 13,20 18,19" fill="#E0F2FE" className="av-anim-spark" />
    </svg>
  );
}

/** Egida del Guardiano: scudo con raggiera solare rotante e zaffiro incastonato. */
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
      {/* Raggiera solare che ruota */}
      <circle cx="20" cy="20" r="17.5" fill="none" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.45" className="av-anim-orbit" />
      {/* Sagoma scudo allargata */}
      <path
        d="M 6 5 L 34 5 Q 34 23 20 37 Q 6 23 6 5 Z"
        fill={`url(#sh-steel-${uid})`}
        stroke={`url(#sh-gold-${uid})`}
        strokeWidth="2.2"
      />
      <path d="M 9.5 8 L 30.5 8 Q 30.5 22 20 32.5 Q 9.5 22 9.5 8 Z" fill="none" stroke="#FBBF24" strokeWidth="0.9" opacity="0.7" />
      {/* Emblema Leone e gemma zaffiro */}
      <path d="M 20 10 L 25 15 L 23 21 L 20 18 L 17 21 L 15 15 Z" fill={`url(#sh-gold-${uid})`} />
      <circle cx="20" cy="22" r="3.2" fill={`url(#sh-gold-${uid})`} />
      <polygon points="20,20 21.8,23 20,26 18.2,23" fill="#38BDF8" className="av-anim-ruby" />
    </svg>
  );
}

/** Calice della Vittoria: coppa imperiale con stella splendente e raggio di trionfo. */
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
      {/* Stella di luce sulla sommità con bagliore trionfale */}
      <polygon points="20,1 22,5.5 27,7 22,8.5 20,13 18,8.5 13,7 18,5.5" fill="#FEF08A" className="av-anim-trophy" />
      {/* Manici sagomati ampi */}
      <path d="M 11 13 Q 3 15 5 24 Q 8 28 13 26" fill="none" stroke={`url(#tr-gold-${uid})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M 29 13 Q 37 15 35 24 Q 32 28 27 26" fill="none" stroke={`url(#tr-gold-${uid})`} strokeWidth="2" strokeLinecap="round" />
      {/* Coppa */}
      <path d="M 9.5 9.5 L 30.5 9.5 L 28 23 Q 20 29 12 23 Z" fill={`url(#tr-gold-${uid})`} stroke="#78350F" strokeWidth="0.9" />
      <path d="M 17.5 26.5 L 22.5 26.5 L 22.5 32 L 17.5 32 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="0.6" />
      <path d="M 11 33 L 29 33 L 31 38 L 9 38 Z" fill={`url(#tr-gold-${uid})`} stroke="#78350F" strokeWidth="0.9" />
      <polygon points="20,14 21.3,17 24.5,17.5 22,19.5 22.8,22.5 20,21 17.2,22.5 18,19.5 15.5,17.5 18.7,17" fill="#FFFBEB" />
    </svg>
  );
}
