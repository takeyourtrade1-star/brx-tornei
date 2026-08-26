'use client';

import { AlertTriangle, Hammer, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { getFormat } from '@/lib/data/catalog';
import { getDeckArchetype } from '@/lib/data/deck-archetypes';
import { countCards, getMainDeckMinSize, getSideboardMaxSize } from '@/lib/data/deck-utils';
import { isDeckStructureComplete } from '@/lib/deck-structure';
import type { Deck } from '@/types/deck';
import { FORMAT_META } from './create-deck-form';

type Status = 'verified' | 'mismatch' | 'legal' | 'building';

const STATUS_META: Record<Status, { label: string; className: string; Icon: typeof ShieldCheck }> = {
  verified: { label: 'Verificato', className: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300', Icon: ShieldCheck },
  mismatch: { label: 'Discrepanza', className: 'border-red-400/30 bg-red-500/15 text-red-300', Icon: AlertTriangle },
  legal: { label: 'Legale', className: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300', Icon: ShieldCheck },
  building: { label: 'In costruzione', className: 'border-amber-400/30 bg-amber-500/15 text-amber-300', Icon: Hammer },
};

export function DeckListCard({ deck, onEdit, onDelete }: {
  deck: Deck;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const format = getFormat(deck.formatId);
  const archetype = getDeckArchetype(deck.archetypeId);
  const mainCount = countCards(deck.main);
  const sideCount = countCards(deck.side);
  const target = getMainDeckMinSize(deck.formatId);
  const maxSide = getSideboardMaxSize(deck.formatId);
  const complete = isDeckStructureComplete(deck);
  const accent = FORMAT_META[deck.formatId]?.color ?? '#FF7300';
  const progress = Math.min(100, Math.round((mainCount / target) * 100));
  const status: Status = deck.verificationStatus === 'verified'
    ? 'verified'
    : deck.verificationStatus === 'mismatch'
      ? 'mismatch'
      : complete ? 'legal' : 'building';
  const { label, className, Icon } = STATUS_META[status];

  return (
    <div className="arena-card p-4">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} aria-hidden />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-display text-base font-black uppercase tracking-wide text-white">
              {deck.name}
            </span>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}>
              <Icon className="h-3 w-3" />
              {label}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/75">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
              {format?.name ?? deck.formatId}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/55">
              {archetype?.name ?? deck.archetypeId}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={onEdit} aria-label="Modifica mazzo" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/80 transition-colors hover:bg-white/20 hover:text-white">
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Modifica</span>
          </button>
          <button type="button" onClick={onDelete} aria-label="Elimina mazzo" className="inline-flex items-center justify-center rounded-lg bg-red-500/10 p-2 text-red-300 transition-colors hover:bg-red-500/20">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 pl-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-white/50">
          <span>
            Main <span className="text-white">{mainCount}</span>/{target}
            {maxSide > 0 && (
              <span className="ml-2 text-white/40">
                Side <span className="text-white/70">{sideCount}</span>/{maxSide}
              </span>
            )}
          </span>
          <span className={complete ? 'text-emerald-300' : 'text-amber-300'}>{progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: complete ? '#34d399' : accent }} />
        </div>
      </div>
    </div>
  );
}
