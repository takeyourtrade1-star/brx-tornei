'use client';

import { Check, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AllFormatsBarProps {
  selected: boolean;
  onSelect: () => void;
}

/**
 * Filtro aggregato "Tutti i formati": barra lunga sopra la griglia, non una
 * tile come gli altri formati. Vivace solo quando selezionata: da spenta è
 * neutra con accenti arancioni, per non rubare spazio ai formati.
 */
export function AllFormatsBar({ selected, onSelect }: AllFormatsBarProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label="Tutti i formati"
      className={cn(
        'group flex w-full items-center gap-3 rounded-full px-4 py-2.5 transition-all duration-300 ease-out motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        selected
          ? 'bg-gradient-to-r from-[#FF7300] to-[#e0564d] shadow-[0_10px_24px_-10px_rgba(255,115,0,0.5)] ring-2 ring-inset ring-white/80'
          : 'border border-white/15 bg-white/10 backdrop-blur-md shadow-xs hover:border-white/25 hover:bg-white/15',
      )}
    >
      <span
        className={cn(
          'grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:scale-105',
          selected
            ? 'bg-white/[0.14] ring-1 ring-white/25'
            : 'bg-white/10 ring-1 ring-white/15 group-hover:bg-primary/20',
        )}
      >
        <Swords
          className={cn('h-4 w-4', selected ? 'text-white' : 'text-primary')}
          aria-hidden="true"
        />
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-left text-[12px] font-black uppercase tracking-[0.14em]',
          selected ? 'text-white' : 'text-white/80 group-hover:text-white',
        )}
      >
        Tutti i formati
      </span>
      {selected ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white ring-1 ring-white/30">
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          Attivo
        </span>
      ) : (
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-white/50 transition-colors group-hover:text-primary">
          Tutti i tavoli
        </span>
      )}
    </button>
  );
}