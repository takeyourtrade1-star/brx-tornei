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
    <div className="flex items-center gap-3 rounded-xl border border-slate-900/10 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-slate-100">
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
        <p className="truncate text-xs font-bold text-header-bg">{card.name}</p>
        <p className="text-[10px] font-medium text-slate-500">{card.setName ?? '—'}</p>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeQuantity(Math.max(0, card.quantity - 1))}
            className="grid h-6 w-6 place-items-center rounded-md border border-slate-900/10 bg-slate-100 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
          >
            −
          </button>
          <span className="min-w-[1.5rem] text-center text-xs font-bold text-header-bg">
            {card.quantity}
          </span>
          <button
            type="button"
            onClick={() => onChangeQuantity(Math.min(maxQuantity, card.quantity + 1))}
            className="grid h-6 w-6 place-items-center rounded-md border border-slate-900/10 bg-slate-100 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          type="button"
          onClick={onMove}
          className="rounded-md border border-slate-900/10 bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700 transition-colors hover:bg-slate-200"
        >
          {moveLabel}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md border border-red-500/20 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase text-red-600 transition-colors hover:bg-red-100"
        >
          Rimuovi
        </button>
      </div>
    </div>
  );
}
