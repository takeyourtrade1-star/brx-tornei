'use client';

import { getCardImageUrl } from '@/lib/assets';
import type { InventoryItem } from '@/types/inventory';
import { CardLegalityBadges } from './card-legality-badges';

interface InventoryMacroCardProps {
  item: InventoryItem;
}

export function InventoryMacroCard({ item }: InventoryMacroCardProps) {
  const imageUrl = getCardImageUrl(item.card.image);
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/[0.07]">
      <div className="flex items-start gap-3">
        <div className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-black/30">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.card.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
              ?
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-white">{item.card.name}</h3>
          <p className="text-xs text-white/50">
            {item.card.setName ?? '—'}
            {item.card.setCode ? ` (${item.card.setCode.toUpperCase()})` : ''}
          </p>
          <p className="mt-1 text-xs text-white/70">
            Qtà: <span className="font-bold text-[#F3C76A]">{item.quantity}</span>
            {item.card.rarity ? ` · ${item.card.rarity}` : ''}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-white/40">
          Formati (Asso Vision)
        </p>
        <CardLegalityBadges legalities={item.card.tournamentLegalities} compact />
      </div>
    </article>
  );
}
