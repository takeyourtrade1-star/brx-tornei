'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Layers } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchDeckChipProps {
  player: Participant;
  formatName: string;
}

/**
 * Chip mazzo sovrapposto alla webcam: chiuso è una pillola minima, al click
 * apre il dettaglio (nome, archetipo, formato, verifica).
 */
export function MatchDeckChip({ player, formatName }: MatchDeckChipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const waiting = player.id === '__waiting__';
  const deck = player.deck;

  // Chiude il popover cliccando fuori dal chip.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={'Dettagli mazzo di ' + player.username}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition',
          open
            ? 'border-primary/60 bg-primary/25 text-white'
            : 'border-white/15 bg-header-bg/70 text-white/80 hover:border-white/30 hover:bg-header-bg hover:text-white',
        )}
      >
        <Layers className="h-3.5 w-3.5 text-primary" />
        Mazzo
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-56 rounded-2xl border border-white/10 bg-header-bg/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
            Mazzo di {player.username}
          </p>
          <p className="mt-1 text-[13px] font-bold leading-snug text-white">
            {waiting ? 'In attesa…' : (deck?.name ?? 'Mazzo non dichiarato')}
          </p>
          <p className="mt-0.5 text-[11px] text-white/55">
            {formatName}
            {deck?.archetype ? ' · ' + deck.archetype : ''}
          </p>
          {deck?.verified && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Verificato
            </span>
          )}
        </div>
      )}
    </div>
  );
}
