'use client';

import { getCardImageUrl } from '@/lib/assets';
import type { InventoryItem } from '@/types/inventory';

interface InventoryCardProps {
  item: InventoryItem;
  mainQty: number;
  sideQty: number;
  canAddMain: boolean;
  canAddSide: boolean;
  onAddMain: () => void;
  onAddSide: () => void;
}

export function InventoryCard({
  item,
  mainQty,
  sideQty,
  canAddMain,
  canAddSide,
  onAddMain,
  onAddSide,
}: InventoryCardProps) {
  const totalInDecks = mainQty + sideQty;
  const remaining = item.quantity - totalInDecks;
  const imageUrl = getCardImageUrl(item.card.image);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/[0.07]">
      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-black/30">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.card.name}
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
        <p className="truncate text-xs font-bold text-white">{item.card.name}</p>
        <p className="text-[10px] text-white/50">
          {item.card.setName ?? '—'} · Possedute: {item.quantity}
        </p>
        {totalInDecks > 0 && (
          <p className="text-[10px] text-[#F3C76A]">
            Nel mazzo: {mainQty} main / {sideQty} side
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          type="button"
          disabled={!canAddMain}
          onClick={onAddMain}
          className="rounded-md bg-[#FF7300]/20 px-2 py-1 text-[10px] font-bold uppercase text-[#FF7300] transition-colors hover:bg-[#FF7300]/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Main
        </button>
        <button
          type="button"
          disabled={!canAddSide}
          onClick={onAddSide}
          className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Side
        </button>
      </div>
    </div>
  );
}
