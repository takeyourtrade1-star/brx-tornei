'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Hammer,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { getFormat } from '@/lib/data/catalog';
import { getDeckArchetype } from '@/lib/data/deck-archetypes';
import { countCards, getMainDeckMinSize, getSideboardMaxSize } from '@/lib/data/deck-utils';
import { FORMAT_MEDIA } from '@/lib/data/format-media';
import { isDeckStructureComplete } from '@/lib/deck-structure';
import type { Deck } from '@/types/deck';

type Status = 'verified' | 'mismatch' | 'legal' | 'building';

const STATUS_META: Record<Status, { label: string; className: string; Icon: typeof ShieldCheck }> = {
  verified: { label: 'Verificato', className: 'border-emerald-400/30 border-l-emerald-300 bg-slate-950/75 text-emerald-200', Icon: ShieldCheck },
  mismatch: { label: 'Da controllare', className: 'border-red-400/30 border-l-red-300 bg-slate-950/75 text-red-200', Icon: AlertTriangle },
  legal: { label: 'Pronto', className: 'border-emerald-400/30 border-l-emerald-300 bg-slate-950/75 text-emerald-200', Icon: ShieldCheck },
  building: { label: 'In costruzione', className: 'border-amber-400/30 border-l-amber-300 bg-slate-950/75 text-amber-200', Icon: Hammer },
};

export function DeckListCard({ deck, onEdit, onDelete }: {
  deck: Deck;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const format = getFormat(deck.formatId);
  const archetype = getDeckArchetype(deck.archetypeId);
  const mainCount = countCards(deck.main);
  const sideCount = countCards(deck.side);
  const target = getMainDeckMinSize(deck.formatId);
  const maxSide = getSideboardMaxSize(deck.formatId);
  const complete = isDeckStructureComplete(deck);
  const progress = Math.min(100, Math.round((mainCount / target) * 100));
  const status: Status = deck.verificationStatus === 'verified'
    ? 'verified'
    : deck.verificationStatus === 'mismatch'
      ? 'mismatch'
      : complete ? 'legal' : 'building';
  const { label, className, Icon } = STATUS_META[status];

  return (
    <article className="group relative aspect-[5/7] min-h-[26rem] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl shadow-black/40 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50">
      <span className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${FORMAT_MEDIA[deck.formatId].image})` }} aria-hidden />
      <span className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/35 to-slate-950" aria-hidden />
      <span className="pointer-events-none absolute inset-2 rounded-[1.15rem] border border-white/[0.08]" aria-hidden />

      <div className="relative flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-md border border-white/20 border-l-2 border-l-primary/80 bg-slate-950/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md">
            {format?.name ?? deck.formatId}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-md border border-l-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] backdrop-blur-md ${className}`}>
              <Icon className="h-3 w-3" aria-hidden />
              {label}
            </span>
            <button type="button" onClick={() => setConfirmDelete(true)} aria-label={`Elimina ${deck.name}`} className="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-slate-950/75 text-white/55 backdrop-blur-md transition hover:border-red-400/40 hover:bg-red-500/25 hover:text-red-200">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-auto">
          <h3 className="truncate font-display text-xl font-black uppercase tracking-wide text-white drop-shadow-lg">
            {deck.name}
          </h3>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/65">
            {archetype?.name ?? deck.archetypeId}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <DeckStat value={`${mainCount}/${target}`} label="Main" />
            <DeckStat value={maxSide > 0 ? `${sideCount}/${maxSide}` : '—'} label="Side" />
            <DeckStat value={`${progress}%`} label="Completato" accent={complete} />
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <span className={`block h-full rounded-full transition-all duration-500 ${complete ? 'bg-emerald-400' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
          </div>

          <button type="button" onClick={onEdit} className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/15 bg-slate-950/70 px-3.5 py-2.5 text-xs font-black uppercase tracking-wide text-white backdrop-blur-md transition hover:border-white/25 hover:bg-slate-900/80">
            {complete ? 'Apri il mazzo' : 'Continua a costruire'}
            <ArrowUpRight className="h-4 w-4 text-primary transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </button>
        </div>
      </div>

      {confirmDelete ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/95 p-5 text-center backdrop-blur-md">
          <button type="button" onClick={() => setConfirmDelete(false)} aria-label="Annulla eliminazione" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
          <div>
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-red-500/15 text-red-300 ring-1 ring-red-400/25">
              <Trash2 className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-3 font-display text-sm font-black uppercase text-white">Eliminare il mazzo?</p>
            <p className="mt-1 text-[11px] text-white/45">Questa azione non può essere annullata.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase text-white/65 hover:bg-white/10">Annulla</button>
              <button type="button" onClick={onDelete} className="rounded-xl bg-red-500 px-3 py-2 text-[10px] font-black uppercase text-white hover:bg-red-400">Elimina</button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function DeckStat({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/65 px-2 py-2 text-center backdrop-blur-md">
      <span className={`block text-xs font-black ${accent ? 'text-emerald-300' : 'text-white'}`}>{value}</span>
      <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-wider text-white/35">{label}</span>
    </div>
  );
}
