'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { AvatarIconProps } from './combat-avatars';

/** Fenice Infuocata: fuoco elementale multilivello con onde termiche e faville. */
export function FlameAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`fl-out-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#991B1B" />
          <stop offset="40%" stopColor="#DC2626" />
          <stop offset="70%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`fl-in-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="60%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <path
        d="M 7 35 C 2 26 5 15 15 7 C 13 13 16 16 20 2 C 24 13 27 14 25 7 C 35 15 38 26 33 35 C 27 40 13 40 7 35 Z"
        fill={`url(#fl-out-${uid})`}
        className="av-anim-flame"
      />
      <path
        d="M 11 34 C 8 27 10 19 17 13 C 15 17 19 20 20 9 C 21 17 25 18 23 13 C 30 19 32 27 29 34 C 24 38 16 38 11 34 Z"
        fill="#F97316"
      />
      <path
        d="M 15 33 C 13 28 15 23 20 17 C 21 21 23 22 25 19 C 27 24 25 29 20 33 Z"
        fill={`url(#fl-in-${uid})`}
        className="av-anim-ruby"
      />
      <circle cx="10" cy="10" r="1.3" fill="#FEF08A" className="av-anim-spark" />
      <circle cx="30" cy="6" r="1" fill="#F97316" className="av-anim-spark" style={{ animationDelay: '0.5s' }} />
    </svg>
  );
}

/** Teschio Spettrale: cranio ossidiana oversize con corna demoniache e anime smeraldo. */
export function SkullAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`sk-bone-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id={`sk-horn-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <path d="M 11 13 C 2 7 1 1 0 0 C 4 6 9 9 13 11 Z" fill={`url(#sk-horn-${uid})`} stroke="#0F172A" strokeWidth="0.6" />
      <path d="M 29 13 C 38 7 39 1 40 0 C 36 6 31 9 27 11 Z" fill={`url(#sk-horn-${uid})`} stroke="#0F172A" strokeWidth="0.6" />
      <path
        d="M 9 14 C 9 5 31 5 31 14 C 31 19 30 23 28 25 L 28 32 L 12 32 L 12 25 C 10 23 9 19 9 14 Z"
        fill={`url(#sk-bone-${uid})`}
        stroke="#0F172A"
        strokeWidth="1.2"
      />
      <ellipse cx="15.5" cy="17" rx="3" ry="4" fill="#022C22" />
      <ellipse cx="24.5" cy="17" rx="3" ry="4" fill="#022C22" />
      <circle cx="15.5" cy="17" r="1.8" fill="#34D399" className="av-anim-souls" />
      <circle cx="24.5" cy="17" r="1.8" fill="#34D399" className="av-anim-souls" />
      <polygon points="20,21.5 18,25 22,25" fill="#0F172A" />
      <line x1="16" y1="28.5" x2="16" y2="32" stroke="#0F172A" strokeWidth="1.2" />
      <line x1="20" y1="28.5" x2="20" y2="32" stroke="#0F172A" strokeWidth="1.2" />
      <line x1="24" y1="28.5" x2="24" y2="32" stroke="#0F172A" strokeWidth="1.2" />
    </svg>
  );
}

/** Fulmine Tempestoso: saetta cristallina al plasma con jitter ad alta energia. */
export function ZapAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`zp-bolt-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#67E8F9" />
          <stop offset="70%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      <path d="M 6 10 L 13 14 L 9 20" fill="none" stroke="#67E8F9" strokeWidth="1.2" opacity="0.7" className="av-anim-zap" />
      <path d="M 34 19 L 27 23 L 31 29" fill="none" stroke="#67E8F9" strokeWidth="1.2" opacity="0.7" className="av-anim-zap" style={{ animationDelay: '0.4s' }} />
      <polygon
        points="23,1 8,20 18,20 13,39 32,15 21,15"
        fill={`url(#zp-bolt-${uid})`}
        stroke="#E0F2FE"
        strokeWidth="0.9"
        className="av-anim-zap"
      />
      <polygon points="22,5 12,19 18,19 15,31 28,16 21,16" fill="#FFFFFF" opacity="0.85" />
    </svg>
  );
}

/** Drago delle Ombre: testa di drago leggendario con corna arcaniche e respiro cosmico. */
export function GhostAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`dg-scale-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id={`dg-horn-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      {/* Corna del Drago */}
      <path d="M 12 12 C 7 5 3 2 1 1 C 7 5 11 9 14 13 Z" fill={`url(#dg-horn-${uid})`} />
      <path d="M 28 12 C 33 5 37 2 39 1 C 33 5 29 9 26 13 Z" fill={`url(#dg-horn-${uid})`} />
      <path d="M 20 6 L 22 0 L 18 0 Z" fill="#C084FC" />
      {/* Cranio e Fauci del Drago */}
      <path
        d="M 10 14 C 10 8 30 8 30 14 C 30 18 33 22 34 26 L 31 27 L 27 24 L 20 28 L 13 24 L 9 27 L 6 26 C 7 22 10 18 10 14 Z"
        fill={`url(#dg-scale-${uid})`}
        stroke="#818CF8"
        strokeWidth="0.9"
      />
      {/* Muso e mandibola inferiore */}
      <path d="M 13 25 L 20 29 L 27 25 L 25 33 L 20 35 L 15 33 Z" fill="#1E1B4B" stroke="#6366F1" strokeWidth="0.7" />
      {/* Occhi a fessura drago ciano/viola luminosi */}
      <polygon points="14,16 19,15 17,18" fill="#38BDF8" className="av-anim-ruby" />
      <polygon points="26,16 21,15 23,18" fill="#38BDF8" className="av-anim-ruby" />
      {/* Respiro dell'anima draconico / fiammelle */}
      <path d="M 18 34 Q 20 39 22 34 Q 20 37 18 34 Z" fill="#A855F7" className="av-anim-dragon" />
    </svg>
  );
}

/** Sfera Arcana: cristallo cosmico sfaccettato con anello planetario orbitante. */
export function SparklesAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`sp-gem-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>
      <ellipse cx="20" cy="20" rx="18.5" ry="6.5" fill="none" stroke="#E879F9" strokeWidth="1.3" transform="rotate(-25 20 20)" strokeDasharray="3 2" className="av-anim-orbit" />
      <polygon points="20,6 30,13 30,27 20,34 10,27 10,13" fill={`url(#sp-gem-${uid})`} stroke="#FDF4FF" strokeWidth="0.9" />
      <polygon points="20,6 20,20 30,13" fill="#F472B6" opacity="0.65" />
      <polygon points="20,20 30,27 20,34" fill="#581C87" opacity="0.65" />
      <polygon points="10,13 20,20 10,27" fill="#A855F7" opacity="0.75" />
      <polygon points="32,5 33.8,8 37,9.5 33.8,11 32,14 30.2,11 27,9.5 30.2,8" fill="#FDF4FF" className="av-anim-spark" />
      <polygon points="7,27 8.2,29 10.5,30 8.2,31 7,33 5.8,31 3.5,30 5.8,29" fill="#FDF4FF" className="av-anim-spark" style={{ animationDelay: '0.6s' }} />
    </svg>
  );
}

/** Carte del Duellante: tris di carte TCG foil olografiche con asse dorato splendente. */
export function GamepadAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`cd-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="80%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id={`cd-bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
      {/* Carta Sinistra (-18 gradi) */}
      <g transform="rotate(-18 10 32)">
        <rect x="5" y="8" width="15" height="24" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="0.8" />
        <rect x="7" y="10" width="11" height="20" rx="1" fill="#1E293B" stroke="#64748B" strokeWidth="0.5" strokeDasharray="2 1" />
      </g>
      {/* Carta Destra (+18 gradi) */}
      <g transform="rotate(18 30 32)">
        <rect x="20" y="8" width="15" height="24" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="0.8" />
        <rect x="22" y="10" width="11" height="20" rx="1" fill="#1E293B" stroke="#64748B" strokeWidth="0.5" strokeDasharray="2 1" />
      </g>
      {/* Carta Centrale (Fronte Olografico) */}
      <rect x="12" y="5" width="16" height="27" rx="2.5" fill={`url(#cd-bg-${uid})`} stroke={`url(#cd-gold-${uid})`} strokeWidth="1.2" className="av-anim-cards" />
      <rect x="14" y="7" width="12" height="23" rx="1.5" fill="none" stroke="#FDE68A" strokeWidth="0.5" opacity="0.6" />
      {/* Emblema Asso / Gemma Runic centrale */}
      <polygon points="20,13 24,18.5 20,24 16,18.5" fill={`url(#cd-gold-${uid})`} stroke="#FFFBEB" strokeWidth="0.4" className="av-anim-ruby" />
      <circle cx="20" cy="18.5" r="1.3" fill="#38BDF8" />
      {/* Scintille olografiche agli angoli */}
      <polygon points="26,7 27,8.5 29,9 27,9.5 26,11 25,9.5 23,9 25,8.5" fill="#FFFBEB" className="av-anim-spark" />
      <polygon points="14,27 15,28 16.5,28.5 15,29 14,30 13,29 11.5,28.5 13,28" fill="#FFFBEB" className="av-anim-spark" style={{ animationDelay: '0.6s' }} />
    </svg>
  );
}
