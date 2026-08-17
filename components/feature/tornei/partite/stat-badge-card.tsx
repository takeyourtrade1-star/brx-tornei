import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

interface StatBadgeCardProps {
  label: string;
  value: string | number;
  Icon: ComponentType<{ className?: string }>;
  iconColor: string;
  bgGlow: string;
  variant?: 'regular' | 'compact';
  className?: string;
}

/** Card statistica scura con valore in primo piano e icona in filigrana. */
export function StatBadgeCard({
  label,
  value,
  Icon,
  iconColor,
  bgGlow,
  variant = 'regular',
  className,
}: StatBadgeCardProps) {
  const compact = variant === 'compact';

  return (
    <div
      aria-label={`${label}: ${value}`}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden border border-white/10 bg-slate-950/80 shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-900/90',
        compact
          ? 'min-h-[76px] rounded-xl p-2.5 sm:min-h-[84px] sm:p-3'
          : 'min-h-[96px] rounded-2xl p-3.5 sm:min-h-[104px] sm:p-4',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-75"
        style={{ background: `radial-gradient(circle at 85% 85%, ${bgGlow}, transparent 70%)` }}
      />

      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute transition-all duration-300 group-hover:scale-110 group-hover:opacity-45 [mask-image:radial-gradient(circle_at_center,black_50%,transparent_90%)]',
          compact
            ? '-bottom-1 -right-1 h-14 w-14 opacity-25 sm:h-16 sm:w-16'
            : '-bottom-2 -right-2 h-20 w-20 opacity-30 sm:h-24 sm:w-24',
        )}
      >
        <Icon className={cn('h-full w-full', iconColor)} />
      </div>

      <span
        className={cn(
          'relative font-black uppercase tracking-wider',
          compact ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]',
          iconColor,
        )}
      >
        {label}
      </span>

      <span
        className={cn(
          'relative mt-2 font-display font-black tabular-nums tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
          compact ? 'text-xl leading-none sm:text-2xl' : 'text-2xl sm:text-3xl',
        )}
      >
        {value}
      </span>
    </div>
  );
}
