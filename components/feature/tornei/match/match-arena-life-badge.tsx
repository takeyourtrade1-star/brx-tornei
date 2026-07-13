import { Heart, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchArenaLifeBadgeProps {
  username: string;
  life: number;
  playerId: string;
  connected: boolean;
  side: 'local' | 'remote';
  onChange: (playerId: string, delta: number) => void;
}

export function MatchArenaLifeBadge({
  username,
  life,
  playerId,
  connected,
  side,
  onChange,
}: MatchArenaLifeBadgeProps) {
  return (
    <div
      className={cn(
        'absolute z-40 flex items-center gap-1 rounded-2xl border border-primary/50 bg-header-bg/90 p-1.5 shadow-[0_0_35px_rgba(255,115,0,0.28)] backdrop-blur-xl',
        side === 'remote'
          ? 'left-2 top-11 sm:-left-5 sm:top-1/2 sm:-translate-y-1/2 sm:flex-col'
          : '-left-12 top-1/2 -translate-y-1/2 flex-col sm:-left-16',
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 h-px w-5 bg-gradient-to-r from-primary to-white/40',
          side === 'remote' ? '-right-5 hidden sm:block' : '-right-5',
        )}
      />
      <p className="max-w-20 truncate px-1 text-[8px] font-black uppercase tracking-wider text-white/55">
        {username}
      </p>
      <div className="flex items-center gap-1 px-1 text-white">
        <Heart className="h-4 w-4 fill-primary text-primary" />
        <strong className="font-display text-3xl font-black leading-none sm:text-4xl">{life}</strong>
      </div>
      <div className="flex items-center gap-1">
        <LifeButton
          label={`Togli un punto vita a ${username}`}
          disabled={!connected}
          onClick={() => onChange(playerId, -1)}
        >
          <Minus className="h-3.5 w-3.5" />
        </LifeButton>
        <LifeButton
          label={`Aggiungi un punto vita a ${username}`}
          disabled={!connected}
          onClick={() => onChange(playerId, 1)}
        >
          <Plus className="h-3.5 w-3.5" />
        </LifeButton>
      </div>
    </div>
  );
}

function LifeButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-lg border border-white/15 bg-white/10 transition hover:border-primary/60 hover:bg-primary/25 active:scale-90 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
