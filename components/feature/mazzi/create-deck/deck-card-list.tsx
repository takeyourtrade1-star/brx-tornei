'use client';

import { Minus, Trash2 } from 'lucide-react';
import type { DeckCardEntry } from '@/types/deck';

interface DeckCardListProps {
  entries: DeckCardEntry[];
  emptyLabel: string;
  onRemove: (cardId: string) => void;
}

export function DeckCardList({ entries, emptyLabel, onRemove }: DeckCardListProps) {
  if (entries.length === 0) {
    return <p className="py-4 text-center text-xs text-white/40">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {entries.map((entry) => (
        <li
          key={entry.cardId}
          className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
        >
          <div className="min-w-0 flex-1">
            <span className="mr-2 font-mono text-xs font-bold text-marquee">{entry.quantity}x</span>
            <span className="truncate text-sm text-white/85">{entry.name}</span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(entry.cardId)}
            className="shrink-0 rounded-md p-1 text-white/40 transition-colors hover:bg-red-500/20 hover:text-red-300"
            aria-label={`Rimuovi ${entry.name}`}
          >
            {entry.quantity > 1 ? (
              <Minus className="h-3.5 w-3.5" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
