import { User, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LobbySeatProps {
  occupied: boolean;
  username?: string | null;
  label: string;
  isMe?: boolean;
  compact?: boolean;
}

/** Posto giocatore condiviso tra card lobby e riepilogo del modale. */
export function LobbySeat({
  occupied,
  username,
  label,
  isMe = false,
  compact = false,
}: LobbySeatProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center rounded-2xl border text-left',
        compact
          ? 'min-h-[4.25rem] gap-2 p-2'
          : 'min-h-[5.25rem] gap-2.5 p-2.5 sm:gap-3 sm:p-3.5',
        occupied
          ? 'border-white/15 bg-white/[0.09] shadow-sm'
          : 'border-dashed border-white/20 bg-black/10',
        isMe && 'border-card3-start/40 bg-card3-start/10',
      )}
    >
      <span
        className={cn(
          'shrink-0 place-items-center rounded-full border',
          compact ? 'hidden h-9 w-9 sm:grid' : 'grid h-9 w-9 sm:h-11 sm:w-11',
          occupied
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
        <span className="block truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
          {label}
        </span>
        <span
          className={cn(
            'mt-1 block truncate font-black',
            compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-base',
            occupied ? 'text-white' : 'text-white/55',
          )}
        >
          {occupied ? username : 'Posto libero'}
        </span>
      </span>

      {isMe && !compact && (
        <span className="hidden shrink-0 rounded-full bg-card3-start/15 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-card3-start sm:inline-flex">
          Tu
        </span>
      )}
    </div>
  );
}

export function VersusBadge() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-card2-end/70 text-[10px] font-black uppercase tracking-wider text-white/55 shadow-sm">
      vs
    </span>
  );
}
