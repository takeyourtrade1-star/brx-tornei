'use client';

import { getCardImageUrl } from '@/lib/assets';
import type { DeckCard as DeckCardType } from '@/types/deck';

interface DeckCardProps {
  card: DeckCardType;
  maxQuantity: number;
  onChangeQuantity: (quantity: number) => void;
  onMove?: () => void;
  onRemove: () => void;
  moveLabel?: string;
  commanderControl?: {
    selected: boolean;
    onSelect: () => void;
  };
}

export function DeckCard({
  card,
  maxQuantity,
  onChangeQuantity,
  onMove,
  onRemove,
  moveLabel,
  commanderControl,
}: DeckCardProps) {
  const imageUrl = getCardImageUrl(card.image);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-white/10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
            ?
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-white">{card.name}</p>
        <p className="text-[10px] font-medium text-white/50">{card.setName ?? '—'}</p>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeQuantity(Math.max(0, card.quantity - 1))}
            aria-label={`Riduci quantità di ${card.name}`}
            className="grid h-6 w-6 place-items-center rounded-md border border-white/15 bg-white/10 text-xs font-bold text-white transition-colors hover:bg-white/20"
          >
            −
          </button>
          <span className="min-w-[1.5rem] text-center text-xs font-bold text-white">
            {card.quantity}
          </span>
          <button
            type="button"
            onClick={() => onChangeQuantity(Math.min(maxQuantity, card.quantity + 1))}
            disabled={card.quantity >= maxQuantity}
            aria-label={`Aumenta quantità di ${card.name}`}
            className="grid h-6 w-6 place-items-center rounded-md border border-white/15 bg-white/10 text-xs font-bold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        {commanderControl ? (
          <button
            type="button"
            onClick={commanderControl.onSelect}
            disabled={commanderControl.selected || card.quantity !== 1}
            title={card.quantity !== 1 ? 'Il comandante deve essere una singola carta' : undefined}
            className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {commanderControl.selected ? 'Comandante' : 'Imposta'}
          </button>
        ) : onMove && moveLabel ? (
          <button
            type="button"
            onClick={onMove}
            className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white/80 transition-colors hover:bg-white/20"
          >
            {moveLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md border border-red-400/25 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase text-red-300 transition-colors hover:bg-red-500/20"
        >
          Rimuovi
        </button>
      </div>
    </div>
  );
}
