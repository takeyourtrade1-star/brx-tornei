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
  /** Ripristino dei punti vita del giocatore locale. */
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
        'relative flex min-w-0 flex-col items-center gap-1 overflow-hidden rounded-2xl border bg-stone-950/85 px-3.5 py-2 shadow-xl shadow-black/40 backdrop-blur-xl',
        local ? 'border-primary/40' : 'border-sky-400/35',
      )}
    >
      {/* Alone colorato dal basso: lega la capsula all'identità del giocatore. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0',
          local
            ? 'bg-[radial-gradient(circle_at_50%_130%,rgba(255,115,0,0.22),transparent_65%)]'
            : 'bg-[radial-gradient(circle_at_50%_130%,rgba(56,189,248,0.2),transparent_65%)]',
        )}
      />
      <div className="relative flex w-full min-w-0 items-center justify-center gap-1.5">
        <span
          aria-hidden
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            local
              ? 'bg-primary shadow-[0_0_8px_rgba(255,115,0,0.9)]'
              : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]',
          )}
        />
        {roleLabel && (
          <span
            className={cn(
              'shrink-0 text-[9px] font-black uppercase tracking-[0.18em]',
              local ? 'text-primary' : 'text-sky-300',
            )}
          >
            {roleLabel}
          </span>
        )}
        <span className="truncate text-[11px] font-bold text-white/80">{username}</span>
        {!connected && (
          <WifiOff
            className="h-3 w-3 shrink-0 text-red-400"
            aria-label="Punti vita non sincronizzati"
          />
        )}
      </div>
      <div className="relative flex items-center gap-1">
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
        <div className={cn('flex items-center gap-1.5 text-white', interactive && 'mx-1.5')}>
          <Heart
            aria-hidden
            className={cn(
              'h-[18px] w-[18px]',
              local
                ? 'fill-primary text-primary drop-shadow-[0_0_6px_rgba(255,115,0,0.6)]'
                : 'fill-sky-400 text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]',
            )}
          />
          <strong className="min-w-[2ch] text-center font-sans text-4xl font-black leading-none tabular-nums">
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
                title={startingLife ? `Ripristina i tuoi punti vita a ${startingLife}` : 'Ripristina i punti vita'}
                aria-label={
                  startingLife ? `Ripristina i tuoi punti vita a ${startingLife}` : 'Ripristina i punti vita'
                }
                className="ml-1 grid h-7 w-7 place-items-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
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
        'grid h-8 min-w-8 place-items-center rounded-full border border-white/10 bg-white/[0.07] px-1 text-[11px] font-black text-white/85 transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-30',
        local
          ? 'hover:border-primary/60 hover:bg-primary/25 hover:text-white'
          : 'hover:border-sky-400/60 hover:bg-sky-400/25 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}
