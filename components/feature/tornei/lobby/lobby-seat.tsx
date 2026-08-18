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
  onClickPlayer?: (username: string) => void;
}

/** Posto giocatore condiviso tra card lobby e riepilogo del modale. */
export function LobbySeat({
  occupied,
  username,
  label,
  isMe = false,
  compact = false,
  light = false,
  onClickPlayer,
}: LobbySeatProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (occupied && username && !isMe) {
      e.stopPropagation();
      if (onClickPlayer) {
        onClickPlayer(username);
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ebartex-open-player-profile', { detail: { gamertag: username } }),
        );
      }
    }
  };

  const isClickable = occupied && username && !isMe;

  return (
    <div
      className={cn(
        'flex min-w-0 items-center rounded-xl border text-left transition-colors',
        compact
          ? 'min-h-[3.25rem] gap-2 px-2.5 py-2 sm:px-3 sm:py-2.5'
          : 'min-h-[5.25rem] gap-2.5 p-3 sm:gap-3.5 sm:p-4',
        light
          ? occupied
            ? 'border-slate-200/80 bg-slate-50/90 shadow-[0_1px_2px_rgba(15,23,42,0.03)]'
            : 'border-dashed border-slate-300 bg-white/60'
          : occupied
            ? 'border-white/15 bg-white/[0.09] shadow-sm'
            : 'border-dashed border-white/20 bg-black/10',
        isMe &&
          (light
            ? 'border-primary/35 bg-primary/[0.06] shadow-sm ring-1 ring-primary/20'
            : 'border-card3-start/40 bg-card3-start/10'),
      )}
    >
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-lg border font-bold transition-colors',
          compact ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-9 w-9 sm:h-11 sm:w-11 rounded-xl',
          light
            ? occupied
              ? isMe
                ? 'border-primary/30 bg-primary/15 text-primary'
                : 'border-slate-200 bg-white text-slate-700 shadow-sm'
              : 'border-dashed border-slate-300 bg-slate-100/70 text-slate-400'
            : occupied
              ? isMe
                ? 'border-card3-start/35 bg-card3-start/15 text-card3-start'
                : 'border-white/15 bg-white/10 text-white'
              : 'border-white/10 bg-white/[0.05] text-white/35',
        )}
      >
        {occupied ? (
          <User className={compact ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-5 w-5'} aria-hidden="true" />
        ) : (
          <UserPlus className={compact ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-5 w-5'} aria-hidden="true" />
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
        {isClickable ? (
          <button
            type="button"
            onClick={handleClick}
            title={`Vedi profilo di ${username}`}
            className={cn(
              'block truncate font-black leading-snug text-left hover:text-primary transition-colors focus-visible:outline-none',
              compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-base',
              light ? 'text-header-bg' : 'text-white',
            )}
          >
            {username}
          </button>
        ) : (
          <span
            className={cn(
              'block truncate font-black leading-snug',
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
        )}
      </span>

      {isMe && (
        <span
          className={cn(
            'shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider sm:px-2 sm:py-0.5 sm:text-[9px]',
            light ? 'bg-primary/15 text-primary' : 'bg-card3-start/15 text-card3-start',
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
        'grid shrink-0 place-items-center rounded-full border font-black uppercase tracking-wider transition-transform',
        compact ? 'h-7 w-7 text-[8px] sm:h-8 sm:w-8 sm:text-[9px]' : 'h-9 w-9 text-[10px]',
        light
          ? 'border-header-bg/20 bg-header-bg text-white shadow-md'
          : 'border-white/20 bg-header-bg text-primary shadow-md',
      )}
    >
      vs
    </span>
  );
}
