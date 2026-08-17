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
      {/* Fiamma esterna fluida */}
      <path
        d="M 7 35 C 2 26 5 15 15 7 C 13 13 16 16 20 2 C 24 13 27 14 25 7 C 35 15 38 26 33 35 C 27 40 13 40 7 35 Z"
        fill={`url(#fl-out-${uid})`}
        className="av-anim-flame"
      />
      {/* Fiamma media */}
      <path
        d="M 11 34 C 8 27 10 19 17 13 C 15 17 19 20 20 9 C 21 17 25 18 23 13 C 30 19 32 27 29 34 C 24 38 16 38 11 34 Z"
        fill="#F97316"
      />
      {/* Nucleo candido */}
      <path
        d="M 15 33 C 13 28 15 23 20 17 C 21 21 23 22 25 19 C 27 24 25 29 20 33 Z"
        fill={`url(#fl-in-${uid})`}
        className="av-anim-ruby"
      />
      {/* Faville volanti */}
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
      {/* Corna ricurve grandi */}
      <path d="M 11 13 C 2 7 1 1 0 0 C 4 6 9 9 13 11 Z" fill={`url(#sk-horn-${uid})`} stroke="#0F172A" strokeWidth="0.6" />
      <path d="M 29 13 C 38 7 39 1 40 0 C 36 6 31 9 27 11 Z" fill={`url(#sk-horn-${uid})`} stroke="#0F172A" strokeWidth="0.6" />
      {/* Calotta cranica */}
      <path
        d="M 9 14 C 9 5 31 5 31 14 C 31 19 30 23 28 25 L 28 32 L 12 32 L 12 25 C 10 23 9 19 9 14 Z"
        fill={`url(#sk-bone-${uid})`}
        stroke="#0F172A"
        strokeWidth="1.2"
      />
      {/* Occhi ardenti spettrali smeraldo */}
      <ellipse cx="15.5" cy="17" rx="3" ry="4" fill="#022C22" />
      <ellipse cx="24.5" cy="17" rx="3" ry="4" fill="#022C22" />
      <circle cx="15.5" cy="17" r="1.8" fill="#34D399" className="av-anim-souls" />
      <circle cx="24.5" cy="17" r="1.8" fill="#34D399" className="av-anim-souls" />
      {/* Cavità nasale e denti */}
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
      {/* Archi elettrici ionizzati */}
      <path d="M 6 10 L 13 14 L 9 20" fill="none" stroke="#67E8F9" strokeWidth="1.2" opacity="0.7" className="av-anim-zap" />
      <path d="M 34 19 L 27 23 L 31 29" fill="none" stroke="#67E8F9" strokeWidth="1.2" opacity="0.7" className="av-anim-zap" style={{ animationDelay: '0.4s' }} />
      {/* Corpo saetta geometrico grande */}
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

/** Spettro delle Ombre: figura eterea incappucciata con lievitazione spettrale. */
export function GhostAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`gh-robe-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <g className="av-anim-ghost">
        <path
          d="M 20 4 C 9 4 7 14 7 24 C 7 34 4 38 9 38 C 12 38 14 34 17 36 C 19 38 21 38 23 36 C 26 34 28 38 31 38 C 36 38 33 34 33 24 C 33 14 31 4 20 4 Z"
          fill={`url(#gh-robe-${uid})`}
          stroke="#64748B"
          strokeWidth="1.2"
        />
        <ellipse cx="20" cy="17" rx="8" ry="6.5" fill="#020617" />
        <ellipse cx="16.5" cy="17" rx="2.2" ry="1.5" fill="#38BDF8" className="av-anim-ruby" />
        <ellipse cx="23.5" cy="17" rx="2.2" ry="1.5" fill="#38BDF8" className="av-anim-ruby" />
      </g>
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
      {/* Anello orbitale gyroscopico rotante */}
      <ellipse cx="20" cy="20" rx="18.5" ry="6.5" fill="none" stroke="#E879F9" strokeWidth="1.3" transform="rotate(-25 20 20)" strokeDasharray="3 2" className="av-anim-orbit" />
      {/* Cristallo centrale esagonale grande */}
      <polygon points="20,6 30,13 30,27 20,34 10,27 10,13" fill={`url(#sp-gem-${uid})`} stroke="#FDF4FF" strokeWidth="0.9" />
      <polygon points="20,6 20,20 30,13" fill="#F472B6" opacity="0.65" />
      <polygon points="20,20 30,27 20,34" fill="#581C87" opacity="0.65" />
      <polygon points="10,13 20,20 10,27" fill="#A855F7" opacity="0.75" />
      <polygon points="32,5 33.8,8 37,9.5 33.8,11 32,14 30.2,11 27,9.5 30.2,8" fill="#FDF4FF" className="av-anim-spark" />
      <polygon points="7,27 8.2,29 10.5,30 8.2,31 7,33 5.8,31 3.5,30 5.8,29" fill="#FDF4FF" className="av-anim-spark" style={{ animationDelay: '0.6s' }} />
    </svg>
  );
}

/** Cyber Deck: console arcade futuristica neon con illuminazione LED e d-pad ciano. */
export function GamepadAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`gp-body-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="60%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
      {/* Sagoma controller alata grande */}
      <path
        d="M 10 10 Q 20 12 30 10 Q 39 10 39 24 Q 39 33 32 32 L 27 24 Q 20 27 13 24 L 8 32 Q 1 33 1 24 Q 1 10 10 10 Z"
        fill={`url(#gp-body-${uid})`}
        stroke="#6366F1"
        strokeWidth="1.3"
      />
      {/* D-Pad a croce */}
      <path d="M 9 16 H 14 V 18 H 16 V 23 H 14 V 25 H 9 V 23 H 7 V 18 H 9 Z" fill="#06B6D4" />
      {/* Tasti azione laser */}
      <circle cx="30" cy="17" r="1.9" fill="#F43F5E" className="av-anim-cyber" />
      <circle cx="33.5" cy="20.5" r="1.9" fill="#FBBF24" />
      <circle cx="26.5" cy="20.5" r="1.9" fill="#10B981" />
      <circle cx="30" cy="24" r="1.9" fill="#3B82F6" />
      {/* LED centrale */}
      <rect x="18" y="18.5" width="4" height="2.2" rx="1" fill="#A855F7" className="av-anim-ruby" />
    </svg>
  );
}
