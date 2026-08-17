'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { AvatarIconProps } from './combat-avatars';

/** Fenice Infuocata: fuoco elementale a tre livelli con nucleo fuso e faville. */
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
      {/* Fiamma esterna */}
      <path
        d="M 10 33 C 5 25 8 16 16 9 C 14 14 17 17 20 4 C 23 14 26 15 24 9 C 32 16 35 25 30 33 C 25 38 15 38 10 33 Z"
        fill={`url(#fl-out-${uid})`}
        className="animate-pulse"
      />
      {/* Fiamma media */}
      <path
        d="M 13 32 C 10 26 12 19 18 14 C 16 18 19 20 20 11 C 22 18 24 19 22 14 C 28 19 30 26 27 32 C 23 36 17 36 13 32 Z"
        fill="#F97316"
      />
      {/* Nucleo candido */}
      <path
        d="M 16 31 C 14 27 16 23 20 18 C 21 22 23 23 24 20 C 26 24 24 28 20 31 Z"
        fill={`url(#fl-in-${uid})`}
        className="animate-pulse"
      />
      {/* Faville volanti */}
      <circle cx="12" cy="11" r="1" fill="#FEF08A" className="animate-ping" />
      <circle cx="28" cy="8" r="0.8" fill="#F97316" className="animate-ping" style={{ animationDelay: '0.5s' }} />
    </svg>
  );
}

/** Teschio Spettrale: cranio ossidiana con corna demoniache e fiamme dell'anima smeraldo. */
export function SkullAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`sk-bone-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id={`sk-horn-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      {/* Corna ricurve */}
      <path d="M 12 14 C 4 8 3 2 1 1 C 5 7 10 10 14 12 Z" fill={`url(#sk-horn-${uid})`} stroke="#0F172A" strokeWidth="0.5" />
      <path d="M 28 14 C 36 8 37 2 39 1 C 35 7 30 10 26 12 Z" fill={`url(#sk-horn-${uid})`} stroke="#0F172A" strokeWidth="0.5" />
      {/* Calotta cranica */}
      <path
        d="M 11 15 C 11 7 29 7 29 15 C 29 19 28 23 26 25 L 26 31 L 14 31 L 14 25 C 12 23 11 19 11 15 Z"
        fill={`url(#sk-bone-${uid})`}
        stroke="#0F172A"
        strokeWidth="1"
      />
      {/* Occhi ardenti di fuoco spettrale verde/ciano */}
      <ellipse cx="16" cy="18" rx="2.5" ry="3.5" fill="#022C22" />
      <ellipse cx="24" cy="18" rx="2.5" ry="3.5" fill="#022C22" />
      <circle cx="16" cy="18" r="1.5" fill="#34D399" className="animate-pulse" />
      <circle cx="24" cy="18" r="1.5" fill="#34D399" className="animate-pulse" />
      {/* Cavità nasale e denti */}
      <polygon points="20,22 18.5,25 21.5,25" fill="#0F172A" />
      <line x1="17" y1="28" x2="17" y2="31" stroke="#0F172A" strokeWidth="1" />
      <line x1="20" y1="28" x2="20" y2="31" stroke="#0F172A" strokeWidth="1" />
      <line x1="23" y1="28" x2="23" y2="31" stroke="#0F172A" strokeWidth="1" />
    </svg>
  );
}

/** Fulmine Tempestoso: saetta cristallina al plasma con archi elettrici ionizzati. */
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
        <filter id={`zp-glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#22D3EE" floodOpacity="0.9" />
        </filter>
      </defs>
      {/* Archi elettrici attorno */}
      <path d="M 8 12 L 14 15 L 11 20" fill="none" stroke="#67E8F9" strokeWidth="1" opacity="0.6" className="animate-pulse" />
      <path d="M 32 20 L 26 23 L 30 28" fill="none" stroke="#67E8F9" strokeWidth="1" opacity="0.6" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
      {/* Corpo saetta geometrico */}
      <polygon
        points="22,3 9,20 18,20 14,37 31,16 21,16"
        fill={`url(#zp-bolt-${uid})`}
        stroke="#E0F2FE"
        strokeWidth="0.8"
        filter={`url(#zp-glow-${uid})`}
      />
      {/* Anima bianca centrale */}
      <polygon points="21,7 13,19 18,19 16,30 27,17 21,17" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

/** Spettro delle Ombre: spettro incappucciato con occhi ciano luminosi e volute eteree. */
export function GhostAvatarIcon({ className }: AvatarIconProps) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`gh-robe-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="60%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      {/* Corpo del fantasma / mantello */}
      <path
        d="M 20 6 C 11 6 9 15 9 24 C 9 32 6 36 10 36 C 13 36 15 32 17 34 C 19 36 21 36 23 34 C 25 32 27 36 30 36 C 34 36 31 32 31 24 C 31 15 29 6 20 6 Z"
        fill={`url(#gh-robe-${uid})`}
        stroke="#64748B"
        strokeWidth="1"
        className="animate-pulse"
      />
      {/* Ombra del cappuccio */}
      <ellipse cx="20" cy="18" rx="7" ry="5.5" fill="#020617" />
      {/* Occhi eterei ciano */}
      <ellipse cx="17.5" cy="18" rx="1.8" ry="1.2" fill="#38BDF8" className="animate-pulse" />
      <ellipse cx="22.5" cy="18" rx="1.8" ry="1.2" fill="#38BDF8" className="animate-pulse" />
    </svg>
  );
}

/** Sfera Arcana: cristallo cosmico sfaccettato con anelli orbitali planetari. */
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
      {/* Anello orbitale gyroscopico */}
      <ellipse cx="20" cy="20" rx="17" ry="6" fill="none" stroke="#E879F9" strokeWidth="1.2" transform="rotate(-25 20 20)" strokeDasharray="3 2" className="animate-spin" style={{ animationDuration: '10s' }} />
      {/* Cristallo centrale esagonale */}
      <polygon points="20,8 29,14 29,26 20,32 11,26 11,14" fill={`url(#sp-gem-${uid})`} stroke="#FDF4FF" strokeWidth="0.8" />
      {/* Sfaccettature interne */}
      <polygon points="20,8 20,20 29,14" fill="#F472B6" opacity="0.6" />
      <polygon points="20,20 29,26 20,32" fill="#581C87" opacity="0.6" />
      <polygon points="11,14 20,20 11,26" fill="#A855F7" opacity="0.7" />
      {/* Bagliori stellari */}
      <polygon points="31,7 32.5,9.5 35,11 32.5,12.5 31,15 29.5,12.5 27,11 29.5,9.5" fill="#FDF4FF" className="animate-pulse" />
      <polygon points="8,28 9,30 11,31 9,32 8,34 7,32 5,31 7,30" fill="#FDF4FF" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
    </svg>
  );
}

/** Cyber Deck: console arcade futuristica neon con pulsanti laser e scanlines. */
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
      {/* Sagoma controller alato */}
      <path
        d="M 12 12 Q 20 14 28 12 Q 36 12 36 24 Q 36 32 30 31 L 26 24 Q 20 26 14 24 L 10 31 Q 4 32 4 24 Q 4 12 12 12 Z"
        fill={`url(#gp-body-${uid})`}
        stroke="#6366F1"
        strokeWidth="1.2"
      />
      {/* D-Pad a croce */}
      <path d="M 11 17 H 15 V 19 H 17 V 23 H 15 V 25 H 11 V 23 H 9 V 19 H 11 Z" fill="#06B6D4" />
      {/* Tasti azione laser */}
      <circle cx="28" cy="18" r="1.6" fill="#F43F5E" className="animate-pulse" />
      <circle cx="31" cy="21" r="1.6" fill="#FBBF24" />
      <circle cx="25" cy="21" r="1.6" fill="#10B981" />
      <circle cx="28" cy="24" r="1.6" fill="#3B82F6" />
      {/* LED centrale */}
      <rect x="18" y="19" width="4" height="2" rx="1" fill="#A855F7" className="animate-ping" />
    </svg>
  );
}
