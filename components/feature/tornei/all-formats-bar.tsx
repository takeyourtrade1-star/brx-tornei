'use client';

import { Check, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AllFormatsBarProps {
  selected: boolean;
  onSelect: () => void;
}

/**
 * Filtro aggregato "Tutti i formati": barra lunga arancione sopra la griglia,
 * non una tile come gli altri formati.
 */
export function AllFormatsBar({ selected, onSelect }: AllFormatsBarProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label="Tutti i formati"
      className={cn(
        'group flex w-full items-center gap-3 rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 py-2.5 shadow-[0_10px_24px_-10px_rgba(255,115,0,0.5)] transition-[box-shadow,filter] duration-300 ease-out motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        selected
          ? 'ring-2 ring-inset ring-white/80'
          : 'hover:brightness-[1.05] hover:shadow-[0_14px_30px_-10px_rgba(255,115,0,0.6)]',
      )}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.14] ring-1 ring-white/25 transition-transform duration-300 group-hover:scale-105">
        <Swords className="h-4 w-4 text-white" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate text-left text-[12px] font-black uppercase tracking-[0.14em] text-white">
        Tutti i formati
      </span>
      {selected ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white ring-1 ring-white/30">
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          Attivo
        </span>
      ) : (
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors group-hover:text-white/90">
          Tutti i tavoli
        </span>
      )}
    </button>
  );
}