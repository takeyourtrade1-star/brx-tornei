'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, Minus, Plus, RotateCcw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchLifeBadgeProps {
  username: string;
  life: number;
  playerId: string;
  connected: boolean;
  /** Colore identità: arancio primario per il locale, azzurro per l'avversario. */
  variant: 'local' | 'remote';
  /** false per osservatori o partita non iniziata: capsula in sola lettura. */
  interactive?: boolean;
  /** Valore di partenza, usato nel tooltip del reset. */
  startingLife?: number;
  onChange: (playerId: string, delta: number) => void;
  /** Ripristino dei punti vita del giocatore locale. */
  onReset?: () => void;
  /** Nasconde il nome utente se già presente nell'header genitore. */
  hideUsername?: boolean;
  /** Classi CSS opzionali. */
  className?: string;
}

/**
 * Barra HUD punti vita Gaming con glowing border e pulsanti tattili orizzontali.
 */
export function MatchLifeBadge({
  username,
  life,
  playerId,
  connected,
  variant,
  interactive = true,
  startingLife,
  onChange,
  onReset,
  hideUsername = false,
  className,
}: MatchLifeBadgeProps) {
  const local = variant === 'local';
  const [flash, setFlash] = useState<{ id: number; delta: number } | null>(null);
  const prevLife = useRef(life);

  useEffect(() => {
    if (prevLife.current === life) return;
    const delta = life - prevLife.current;
    prevLife.current = life;
    setFlash({ id: Date.now(), delta });
    const t = window.setTimeout(() => setFlash(null), 900);
    return () => window.clearTimeout(t);
  }, [life]);

  return (
    <div
      aria-label={'Punti vita ' + username}
      className={cn(
        'relative flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border px-3 py-1.5 shadow-lg backdrop-blur-xl transition duration-200',
        local
          ? 'border-primary/40 bg-gradient-to-r from-primary/[0.14] via-[#0e1222]/90 to-[#060814]/90 shadow-[0_4px_20px_-4px_rgba(255,115,0,0.3)] ring-1 ring-primary/25'
          : 'border-sky-400/40 bg-gradient-to-r from-sky-400/[0.14] via-[#0e1222]/90 to-[#060814]/90 shadow-[0_4px_20px_-4px_rgba(56,189,248,0.3)] ring-1 ring-sky-400/25',
        className,
      )}
    >
      {/* Alone energetico di fondo */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0',
          local
            ? 'bg-[radial-gradient(circle_at_50%_120%,rgba(255,115,0,0.22),transparent_70%)]'
            : 'bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.2),transparent_70%)]',
        )}
      />

      {/* Intestazione opzionale: nome utente pulito senza rombi */}
      {!hideUsername && (
        <span className="truncate font-sans text-xs font-black uppercase tracking-[0.08em] text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] pr-1">
          {username}
        </span>
      )}

      {/* Avviso mancata connessione / sincronizzazione */}
      {!connected && (
        <WifiOff
          className="relative h-3.5 w-3.5 shrink-0 text-red-400 animate-pulse"
          aria-label="Punti vita non sincronizzati"
        />
      )}

      {/* Controlli decremento */}
      {interactive && (
        <div className="relative flex items-center gap-1">
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
            <Minus className="h-3 w-3" />
          </LifeButton>
        </div>
      )}

      {/* Display centrale punti vita */}
      <div className={cn('relative flex items-center gap-1.5 text-white', interactive ? 'mx-0.5' : 'px-1')}>
        <Heart
          aria-hidden
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            local
              ? 'fill-primary text-primary drop-shadow-[0_0_8px_rgba(255,115,0,0.85)]'
              : 'fill-sky-400 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.85)]',
          )}
        />
        <strong
          className={cn(
            'life-pulse min-w-[2ch] text-center font-sans text-2xl font-black leading-none tabular-nums tracking-tight sm:text-3xl',
            life <= 0
              ? 'text-rose-500 animate-pulse drop-shadow-[0_0_16px_rgba(244,63,94,0.8)]'
              : 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]',
          )}
          key={life}
        >
          {life}
        </strong>
        {flash && (
          <span
            key={flash.id}
            aria-hidden
            className={cn(
              'life-flash pointer-events-none absolute -right-7 -top-1 rounded-full px-1 py-0.5 text-[9px] font-black tabular-nums shadow-lg',
              flash.delta > 0
                ? 'border border-emerald-400/40 bg-emerald-500/25 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                : 'border border-rose-500/40 bg-rose-500/25 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
            )}
          >
            {flash.delta > 0 ? `+${flash.delta}` : `${flash.delta}`}
          </span>
        )}
      </div>

      {/* Controlli incremento e reset */}
      {interactive && (
        <div className="relative flex items-center gap-1">
          <LifeButton
            local={local}
            label={'Aggiungi un punto vita a ' + username}
            disabled={!connected}
            onClick={() => onChange(playerId, 1)}
          >
            <Plus className="h-3 w-3" />
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
              title={startingLife ? `Ripristina punti vita a ${startingLife}` : 'Ripristina punti vita'}
              aria-label={
                startingLife ? `Ripristina punti vita a ${startingLife}` : 'Ripristina punti vita'
              }
              className="ml-0.5 grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/50 transition hover:border-white/25 hover:bg-white/15 hover:text-white active:scale-95 disabled:opacity-25"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
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
        'grid h-7 min-w-7 place-items-center rounded-lg border border-white/15 bg-white/[0.08] px-1 text-[11px] font-black text-white/90 shadow-[0_1px_4px_rgba(0,0,0,0.3)] backdrop-blur-md transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25',
        local
          ? 'hover:border-primary/70 hover:bg-primary/30 hover:text-white hover:shadow-[0_0_8px_rgba(255,115,0,0.4)]'
          : 'hover:border-sky-400/70 hover:bg-sky-400/30 hover:text-white hover:shadow-[0_0_8px_rgba(56,189,248,0.4)]',
      )}
    >
      {children}
    </button>
  );
}
