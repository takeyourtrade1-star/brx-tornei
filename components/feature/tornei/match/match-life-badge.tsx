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
  /** false per osservatori o partita non iniziata: console in sola lettura. */
  interactive?: boolean;
  /** Valore di partenza, usato come riferimento e nel tooltip del reset. */
  startingLife?: number;
  onChange: (playerId: string, delta: number) => void;
  /** Ripristino dei punti vita del giocatore locale. */
  onReset?: () => void;
  /** Nasconde il nome utente se già presente nell'header genitore. */
  hideUsername?: boolean;
  /** stacked: console verticale sotto la webcam; inline: barra compatta per il fullscreen. */
  layout?: 'stacked' | 'inline';
  /** Classi CSS opzionali. */
  className?: string;
}

/** Console punti vita: solo presentazione, la sincronizzazione resta negli hook chiamanti. */
export function MatchLifeBadge({
  username, life, playerId, connected, variant, interactive = true, startingLife,
  onChange, onReset, hideUsername = false, layout = 'stacked', className,
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

  if (layout === 'inline') {
    return (
      <div
        aria-label={'Punti vita ' + username}
        className={cn(
          'flex items-center gap-1.5 rounded-xl border px-2 py-1 shadow-md backdrop-blur-md',
          local
            ? 'border-primary/45 bg-black/55 shadow-[0_0_18px_-6px_rgba(255,115,0,0.55)]'
            : 'border-sky-400/45 bg-black/55 shadow-[0_0_18px_-6px_rgba(56,189,248,0.55)]',
          className,
        )}
      >
        <Heart aria-hidden className={cn('h-3.5 w-3.5 shrink-0', local ? 'fill-primary text-primary drop-shadow-[0_0_6px_rgba(255,115,0,0.9)]' : 'fill-sky-400 text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.9)]')} />
        <span className="relative">
          <strong key={life} className={cn('life-pulse block min-w-[2ch] text-center font-sans text-xl font-black leading-none tabular-nums', life <= 0 ? 'animate-pulse text-rose-500' : 'text-white')}>
            {life}
          </strong>
          {flash && <LifeFlash key={flash.id} delta={flash.delta} />}
        </span>
        {!connected && <WifiOff className="h-3 w-3 shrink-0 animate-pulse text-red-400" aria-label="Punti vita non sincronizzati" />}
        {interactive && (
          <>
            <span className="h-5 w-px bg-white/15" aria-hidden />
            <div className="flex items-center gap-1">
              <LifeStep local={local} label={'Togli un punto vita a ' + username} disabled={!connected} onClick={() => onChange(playerId, -1)}><Minus className="h-3 w-3" /></LifeStep>
              <LifeStep local={local} label={'Aggiungi un punto vita a ' + username} disabled={!connected} onClick={() => onChange(playerId, 1)}><Plus className="h-3 w-3" /></LifeStep>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      aria-label={'Punti vita ' + username}
      className={cn(
        'relative flex flex-col gap-2.5 rounded-2xl border px-3.5 py-3 shadow-xl backdrop-blur-xl',
        local
          ? 'border-primary/40 bg-gradient-to-b from-primary/[0.12] via-[#0e1222]/95 to-[#060814]/95 shadow-[0_12px_32px_-12px_rgba(255,115,0,0.45)]'
          : 'border-sky-400/40 bg-gradient-to-b from-sky-400/[0.12] via-[#0e1222]/95 to-[#060814]/95 shadow-[0_12px_32px_-12px_rgba(56,189,248,0.45)]',
        className,
      )}
    >
      <span aria-hidden className={cn('pointer-events-none absolute inset-x-8 top-0 h-px', local ? 'bg-gradient-to-r from-transparent via-primary to-transparent' : 'bg-gradient-to-r from-transparent via-sky-400 to-transparent')} />
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl border shadow-inner', local ? 'border-primary/50 bg-primary/15 shadow-[0_0_14px_rgba(255,115,0,0.35)]' : 'border-sky-400/50 bg-sky-400/15 shadow-[0_0_14px_rgba(56,189,248,0.35)]')}>
            <Heart className={cn('h-5 w-5', local ? 'fill-primary text-primary drop-shadow-[0_0_8px_rgba(255,115,0,0.9)]' : 'fill-sky-400 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]')} />
          </span>
          <span className="min-w-0">
            {!hideUsername && <span className="block truncate font-sans text-xs font-black uppercase tracking-[0.08em] text-white/95">{username}</span>}
            <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
              {connected ? (
                <><span className={cn('h-1.5 w-1.5 rounded-full', local ? 'bg-primary' : 'bg-sky-400')} aria-hidden />{startingLife !== undefined ? `Base ${startingLife}` : 'Sincronizzati'}</>
              ) : (
                <><WifiOff className="h-3 w-3 animate-pulse text-red-400" aria-label="Punti vita non sincronizzati" /><span className="text-red-300">Non sincronizzati</span></>
              )}
            </span>
          </span>
        </div>
        <span className="relative shrink-0 px-1">
          <strong key={life} className={cn('life-pulse block min-w-[2ch] text-center font-sans text-4xl font-black leading-none tabular-nums tracking-tight', life <= 0 ? 'animate-pulse text-rose-500 drop-shadow-[0_0_18px_rgba(244,63,94,0.8)]' : 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]')}>
            {life}
          </strong>
          {flash && <LifeFlash key={flash.id} delta={flash.delta} large />}
        </span>
      </div>
      {interactive && (
        <div className="flex items-stretch gap-1.5">
          <div className="flex flex-1 items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-1">
            <LifeStep local={local} tone="damage" label={'Togli 5 punti vita a ' + username} disabled={!connected} onClick={() => onChange(playerId, -5)}>−5</LifeStep>
            <LifeStep local={local} tone="damage" label={'Togli un punto vita a ' + username} disabled={!connected} onClick={() => onChange(playerId, -1)}><Minus className="h-3.5 w-3.5" /></LifeStep>
          </div>
          <div className="flex flex-1 items-center gap-1 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-1">
            <LifeStep local={local} tone="heal" label={'Aggiungi un punto vita a ' + username} disabled={!connected} onClick={() => onChange(playerId, 1)}><Plus className="h-3.5 w-3.5" /></LifeStep>
            <LifeStep local={local} tone="heal" label={'Aggiungi 5 punti vita a ' + username} disabled={!connected} onClick={() => onChange(playerId, 5)}>+5</LifeStep>
          </div>
          {onReset && (
            <button type="button" onClick={onReset} disabled={!connected} title={startingLife !== undefined ? `Ripristina punti vita a ${startingLife}` : 'Ripristina punti vita'} aria-label={startingLife !== undefined ? `Ripristina punti vita a ${startingLife}` : 'Ripristina punti vita'} className="grid w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50 transition hover:border-white/25 hover:bg-white/15 hover:text-white active:scale-95 disabled:opacity-25">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Etichetta +N/−N che fluttua sopra il numero e svanisce: mai ritagliata dal contenitore. */
function LifeFlash({ delta, large = false }: { delta: number; large?: boolean }) {
  return (
    <span aria-hidden className={cn('life-flash pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border font-black tabular-nums shadow-lg', large ? '-top-4 px-2 py-0.5 text-[10px]' : '-top-3 px-1.5 text-[9px]', delta > 0 ? 'border-emerald-400/50 bg-emerald-500/90 text-white' : 'border-rose-500/50 bg-rose-600/90 text-white')}>
      {delta > 0 ? `+${delta}` : `${delta}`}
    </span>
  );
}

function LifeStep({ local, tone = 'neutral', label, disabled, onClick, children }: { local: boolean; tone?: 'damage' | 'heal' | 'neutral'; label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={cn('grid h-8 flex-1 place-items-center rounded-lg border border-white/10 bg-white/[0.07] px-1 text-xs font-black text-white/90 shadow-sm backdrop-blur-md transition hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-25', tone === 'damage' && 'hover:border-rose-400/70 hover:bg-rose-500/30 hover:text-white hover:shadow-[0_0_10px_rgba(244,63,94,0.4)]', tone === 'heal' && 'hover:border-emerald-400/70 hover:bg-emerald-500/25 hover:text-white hover:shadow-[0_0_10px_rgba(52,211,153,0.4)]', tone === 'neutral' && (local ? 'hover:border-primary/70 hover:bg-primary/30 hover:text-white' : 'hover:border-sky-400/70 hover:bg-sky-400/30 hover:text-white'))}>
      {children}
    </button>
  );
}
