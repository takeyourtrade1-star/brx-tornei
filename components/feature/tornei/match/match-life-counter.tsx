import { Heart, Link2, Minus, Plus, RotateCcw } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchLifeCounterProps {
  players: [Participant, Participant];
  lifeByPlayerId: Record<string, number>;
  startingLife: number;
  connected: boolean;
  interactive?: boolean;
  orientation?: 'vertical' | 'horizontal';
  onChange: (playerId: string, delta: number) => void;
  onReset: () => void;
}

export function MatchLifeCounter({
  players,
  lifeByPlayerId,
  startingLife,
  connected,
  interactive = true,
  orientation = 'vertical',
  onChange,
  onReset,
}: MatchLifeCounterProps) {
  return (
    <section
      aria-label="Segnapunti vita condiviso"
      className={cn(
        'relative flex overflow-hidden rounded-2xl border border-primary/25 bg-header-bg/95 shadow-[0_18px_55px_rgba(15,23,42,0.35)]',
        orientation === 'vertical' ? 'h-full min-h-[250px] flex-col' : 'items-stretch',
      )}
    >
      <LifeSide
        player={players[0]}
        life={lifeByPlayerId[players[0].id] ?? startingLife}
        connected={connected}
        interactive={interactive}
        orientation={orientation}
        onChange={onChange}
      />
      <div
        className={cn(
          'relative z-10 flex shrink-0 items-center justify-center gap-1 border-white/10 bg-black/25 text-primary',
          orientation === 'vertical'
            ? 'h-9 border-y px-2'
            : 'w-12 flex-col border-x py-2 sm:w-16',
        )}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        <Link2 className="relative h-3.5 w-3.5" />
        <span className="relative text-[9px] font-black uppercase tracking-widest">Live</span>
        {interactive && (
          <button
            type="button"
            onClick={onReset}
            disabled={!connected}
            title={`Ripristina entrambi a ${startingLife}`}
            aria-label={`Ripristina i punti vita a ${startingLife}`}
            className="relative ml-1 grid h-6 w-6 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
      <LifeSide
        player={players[1]}
        life={lifeByPlayerId[players[1].id] ?? startingLife}
        connected={connected}
        interactive={interactive}
        orientation={orientation}
        onChange={onChange}
      />
    </section>
  );
}

function LifeSide({
  player,
  life,
  connected,
  interactive,
  orientation,
  onChange,
}: {
  player: Participant;
  life: number;
  connected: boolean;
  interactive: boolean;
  orientation: 'vertical' | 'horizontal';
  onChange: (playerId: string, delta: number) => void;
}) {
  return (
    <div
      className={cn(
        'relative flex min-w-0 flex-1 items-center justify-center overflow-hidden px-2 py-3 text-center text-white',
        orientation === 'vertical' ? 'flex-col' : 'gap-3 sm:gap-5 sm:px-5',
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,115,0,0.18),transparent_68%)]" />
      <div className="relative min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-wider text-white/55">
          {player.username}
        </p>
        <div className="mt-1 flex items-center justify-center gap-1 text-primary">
          <Heart className="h-4 w-4 fill-current" />
          <strong className="font-sans text-4xl font-black leading-none text-white sm:text-5xl">
            {life}
          </strong>
        </div>
      </div>
      {interactive && (
        <div className={cn('relative flex items-center gap-1', orientation === 'vertical' && 'mt-3')}>
          <LifeButton label={`Togli 5 a ${player.username}`} onClick={() => onChange(player.id, -5)} disabled={!connected}>
            -5
          </LifeButton>
          <LifeButton label={`Togli 1 a ${player.username}`} onClick={() => onChange(player.id, -1)} disabled={!connected}>
            <Minus className="h-3.5 w-3.5" />
          </LifeButton>
          <LifeButton label={`Aggiungi 1 a ${player.username}`} onClick={() => onChange(player.id, 1)} disabled={!connected}>
            <Plus className="h-3.5 w-3.5" />
          </LifeButton>
          <LifeButton label={`Aggiungi 5 a ${player.username}`} onClick={() => onChange(player.id, 5)} disabled={!connected}>
            +5
          </LifeButton>
        </div>
      )}
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
      className="grid h-7 min-w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.07] px-1.5 text-[10px] font-black text-white/80 transition hover:border-primary/50 hover:bg-primary/20 hover:text-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
