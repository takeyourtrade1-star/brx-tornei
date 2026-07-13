import { Heart, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchArenaLifeBadgeProps {
  username: string;
  life: number;
  playerId: string;
  connected: boolean;
  variant: 'local' | 'remote';
  compact?: boolean;
  onChange: (playerId: string, delta: number) => void;
}

export function MatchArenaLifeBadge({
  username,
  life,
  playerId,
  connected,
  variant,
  compact = false,
  onChange,
}: MatchArenaLifeBadgeProps) {
  return (
    <div
      aria-label={variant === 'local' ? 'Punti vita tuoi' : 'Punti vita avversario'}
      className={cn(
        'flex min-w-0 flex-1 flex-col text-center backdrop-blur-xl',
        compact ? 'gap-1 rounded-xl p-2' : 'gap-1.5 rounded-2xl border p-2.5',
        variant === 'local'
          ? 'border-primary/60 bg-header-bg/95 shadow-[0_0_28px_rgba(255,115,0,0.2)]'
          : 'border-white/20 bg-black/80',
      )}
    >
      <p className={cn('truncate font-black uppercase tracking-[0.16em]', compact ? 'text-[8px]' : 'text-[9px]', variant === 'local' ? 'text-primary' : 'text-white/55')}>
        {variant === 'local' ? 'I tuoi punti vita' : 'Vita avversario'}
      </p>
      <p className="truncate text-[10px] font-semibold text-white/65">{username}</p>
      <div className="flex items-center justify-center gap-1 px-1 text-white">
        <Heart className={cn('fill-primary text-primary', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        <strong className={cn('font-sans font-black leading-none', compact ? 'text-2xl' : 'text-3xl sm:text-4xl')}>{life}</strong>
      </div>
      <div className="flex items-center justify-center gap-1">
        <LifeButton
          label={'Togli un punto vita a ' + username}
          disabled={!connected}
          onClick={() => onChange(playerId, -1)}
        >
          <Minus className="h-3.5 w-3.5" />
        </LifeButton>
        <LifeButton
          label={'Aggiungi un punto vita a ' + username}
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
      className="grid h-6 w-6 place-items-center rounded-lg border border-white/15 bg-white/10 transition hover:border-primary/60 hover:bg-primary/25 active:scale-90 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
