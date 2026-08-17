import { cn } from '@/lib/utils';

interface MatchStickerSpecialIconProps {
  id: string;
  className?: string;
  size?: number | string;
}

export function MatchStickerSpecialIcon({ id, className, size }: MatchStickerSpecialIconProps) {
  const style = size ? { width: size, height: size } : undefined;

  if (id === 'crown' || id === 'king') {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={cn('h-full w-full', className)} style={style}>
        <defs>
          <linearGradient id="crownGrad" x1="8" y1="12" x2="40" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <filter id="crownGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#F59E0B" floodOpacity="0.85" />
          </filter>
        </defs>
        <path
          d="M8 36L11 16L19 25L24 10L29 25L37 16L40 36H8Z"
          fill="url(#crownGrad)"
          stroke="#FDE047"
          strokeWidth="2"
          strokeLinejoin="round"
          filter="url(#crownGlow)"
        />
        <circle cx="11" cy="16" r="2.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="24" cy="10" r="3" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="37" cy="16" r="2.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="24" cy="31" r="2" fill="#EC4899" />
        <circle cx="16" cy="31" r="1.5" fill="#3B82F6" />
        <circle cx="32" cy="31" r="1.5" fill="#10B981" />
        <rect x="8" y="34" width="32" height="4" rx="1.5" fill="#B45309" stroke="#FDE047" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn('h-full w-full', className)} style={style}>
      <defs>
        <linearGradient id="iceGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <filter id="iceGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38BDF8" floodOpacity="0.85" />
        </filter>
      </defs>
      <g filter="url(#iceGlow)">
        <path d="M24 6L38 14V30L24 38L10 30V14L24 6Z" fill="url(#iceGrad)" stroke="#BAE6FD" strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 6L38 14L24 22L10 14L24 6Z" fill="#F0F9FF" opacity="0.6" />
        <path d="M24 22V38L38 30V14L24 22Z" fill="#0284C7" opacity="0.4" />
        <path d="M24 11L22 17L26 20M17 24L20 27L18 31" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M32 22L34 24M34 22L32 24" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
