import { Heart, Minus, Plus, RotateCcw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchLifeBadgeProps {
  username: string;
  life: number;
  playerId: string;
  connected: boolean;
  /** Colore identità: arancio primario per il locale, azzurro per l'avversario. */
  variant: 'local' | 'remote';
  /** Etichetta ruolo prima del nome (es. "Tu"/"Avversario"); assente per gli osservatori. */
  roleLabel?: string | null;
  /** false per osservatori o partita non iniziata: capsula in sola lettura. */
  interactive?: boolean;
  /** Valore di partenza, usato solo nel tooltip del reset. */
  startingLife?: number;
  onChange: (playerId: string, delta: number) => void;
  /** Ripristino condiviso di entrambi i giocatori (solo capsula locale). */
  onReset?: () => void;
}

/**
 * Capsula punti vita agganciata alla webcam del giocatore: stessa grafica in
 * griglia e in fullscreen, con distinzione colore per utente.
 */
export function MatchLifeBadge({
  username,
  life,
  playerId,
  connected,
  variant,
  roleLabel = null,
  interactive = true,
  startingLife,
  onChange,
  onReset,
}: MatchLifeBadgeProps) {
  const local = variant === 'local';
  return (
    <div
      aria-label={local ? 'Punti vita tuoi' : 'Punti vita avversario'}
      className={cn(
        'flex min-w-0 flex-col items-center gap-1 rounded-2xl border bg-black/70 px-3 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl',
        local ? 'border-primary/50' : 'border-sky-400/45',
      )}
    >
      <div className="flex w-full min-w-0 items-center justify-center gap-1.5">
        <span
          aria-hidden
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', local ? 'bg-primary' : 'bg-sky-400')}
        />
        {roleLabel && (
          <span
            className={cn(
              'shrink-0 text-[8px] font-black uppercase tracking-[0.18em]',
              local ? 'text-primary' : 'text-sky-300',
            )}
          >
            {roleLabel}
          </span>
        )}
        <span className="truncate text-[10px] font-bold text-white/75">{username}</span>
        {!connected && (
          <WifiOff
            className="h-3 w-3 shrink-0 text-red-400"
            aria-label="Punti vita non sincronizzati"
          />
        )}
      </div>
      <div className="flex items-center gap-1">
        {interactive && (
          <>
            <LifeButton
              local={local}
              label={'Togli 5 punti vita a ' + username}
              disabled={!connected}
              onClick={() => onChange(playerId, -5)}
            >
              -5
            </LifeButton>
            <LifeButton
              local={local}
              label={'Togli un punto vita a ' + username}
              disabled={!connected}
              onClick={() => onChange(playerId, -1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </LifeButton>
          </>
        )}
        <div className={cn('flex items-center gap-1 text-white', interactive && 'mx-1')}>
          <Heart
            aria-hidden
            className={cn('h-4 w-4', local ? 'fill-primary text-primary' : 'fill-sky-400 text-sky-400')}
          />
          <strong className="min-w-[2ch] text-center font-sans text-3xl font-black leading-none tabular-nums">
            {life}
          </strong>
        </div>
        {interactive && (
          <>
            <LifeButton
              local={local}
              label={'Aggiungi un punto vita a ' + username}
              disabled={!connected}
              onClick={() => onChange(playerId, 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </LifeButton>
            <LifeButton
              local={local}
              label={'Aggiungi 5 punti vita a ' + username}
              disabled={!connected}
              onClick={() => onChange(playerId, 5)}
            >
              +5
            </LifeButton>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={!connected}
                title={startingLife ? `Ripristina entrambi a ${startingLife}` : 'Ripristina i punti vita'}
                aria-label={
                  startingLife ? `Ripristina i punti vita a ${startingLife}` : 'Ripristina i punti vita'
                }
                className="ml-0.5 grid h-6 w-6 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LifeButton({
  local,
  label,
  disabled,
  onClick,
  children,
}: {
  local: boolean;
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
      className={cn(
        'grid h-7 min-w-7 place-items-center rounded-lg border border-white/15 bg-white/10 px-1 text-[10px] font-black text-white/85 transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-30',
        local
          ? 'hover:border-primary/60 hover:bg-primary/25 hover:text-white'
          : 'hover:border-sky-400/60 hover:bg-sky-400/25 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}
