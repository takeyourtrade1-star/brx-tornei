'use client';

import { getCardImageUrl } from '@/lib/assets';
import type { DeckCard as DeckCardType } from '@/types/deck';

interface DeckCardProps {
  card: DeckCardType;
  maxQuantity: number;
  onChangeQuantity: (quantity: number) => void;
  onMove: () => void;
  onRemove: () => void;
  moveLabel: string;
}

export function DeckCard({
  card,
  maxQuantity,
  onChangeQuantity,
  onMove,
  onRemove,
  moveLabel,
}: DeckCardProps) {
  const imageUrl = getCardImageUrl(card.image);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2">
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-black/30">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-white/30">
            ?
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-white">{card.name}</p>
        <p className="text-[10px] text-white/50">{card.setName ?? '—'}</p>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeQuantity(Math.max(0, card.quantity - 1))}
            className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-xs text-white transition-colors hover:bg-white/20"
          >
            −
          </button>
          <span className="min-w-[1.5rem] text-center text-xs font-bold text-white">
            {card.quantity}
          </span>
          <button
            type="button"
            onClick={() => onChangeQuantity(Math.min(maxQuantity, card.quantity + 1))}
            className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-xs text-white transition-colors hover:bg-white/20"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          type="button"
          onClick={onMove}
          className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white/20"
        >
          {moveLabel}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase text-red-300 transition-colors hover:bg-red-500/20"
        >
          Rimuovi
        </button>
      </div>
    </div>
  );
}
