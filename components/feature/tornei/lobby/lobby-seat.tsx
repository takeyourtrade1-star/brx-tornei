import { User, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LobbySeatProps {
  occupied: boolean;
  username?: string | null;
  label: string;
  isMe?: boolean;
  compact?: boolean;
  /** Variante chiara per le superfici Apple-style della lobby. */
  light?: boolean;
}

/** Posto giocatore condiviso tra card lobby e riepilogo del modale. */
export function LobbySeat({
  occupied,
  username,
  label,
  isMe = false,
  compact = false,
  light = false,
}: LobbySeatProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center rounded-2xl border text-left',
        compact
          ? 'min-h-[3.25rem] gap-2 rounded-xl px-2.5 py-1.5'
          : 'min-h-[5.25rem] gap-2.5 p-2.5 sm:gap-3 sm:p-3.5',
        light
          ? occupied
            ? 'border-slate-900/[0.08] bg-slate-50'
            : 'border-dashed border-slate-900/[0.14] bg-white'
          : occupied
            ? 'border-white/15 bg-white/[0.09] shadow-sm'
            : 'border-dashed border-white/20 bg-black/10',
        isMe && (light ? 'border-primary/30 bg-primary/[0.05]' : 'border-card3-start/40 bg-card3-start/10'),
      )}
    >
      <span
        className={cn(
          'shrink-0 place-items-center rounded-full border',
          compact ? 'hidden h-9 w-9 sm:grid' : 'grid h-9 w-9 sm:h-11 sm:w-11',
          light
            ? occupied
              ? isMe
                ? 'border-primary/25 bg-primary/10 text-primary'
                : 'border-slate-900/[0.08] bg-white text-slate-600'
              : 'border-slate-900/[0.06] bg-slate-50 text-slate-400'
            : occupied
              ? isMe
                ? 'border-card3-start/35 bg-card3-start/15 text-card3-start'
                : 'border-white/15 bg-white/10 text-white'
              : 'border-white/10 bg-white/[0.05] text-white/35',
        )}
      >
        {occupied ? (
          <User className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
        ) : (
          <UserPlus className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-[9px] font-black uppercase tracking-[0.14em]',
            light ? 'text-slate-400' : 'text-white/45',
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'block truncate font-black',
            compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-base',
            light
              ? occupied
                ? 'text-header-bg'
                : 'text-slate-400'
              : occupied
                ? 'text-white'
                : 'text-white/55',
          )}
        >
          {occupied ? username : 'Posto libero'}
        </span>
      </span>

      {isMe && !compact && (
        <span
          className={cn(
            'hidden shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider sm:inline-flex',
            light ? 'bg-primary/10 text-primary' : 'bg-card3-start/15 text-card3-start',
          )}
        >
          Tu
        </span>
      )}
    </div>
  );
}

export function VersusBadge({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full border font-black uppercase tracking-wider',
        compact ? 'h-8 w-8 text-[8px]' : 'h-9 w-9 text-[10px]',
        light
          ? 'border-slate-900/[0.08] bg-white text-slate-400 shadow-sm'
          : 'border-white/15 bg-card2-end/70 text-white/55 shadow-sm',
      )}
    >
      vs
    </span>
  );
}
