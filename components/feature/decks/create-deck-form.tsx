'use client';

import { useState } from 'react';
import {
  Anchor, ArrowRight, CloudLightning, Flame, Hammer, Layers, Lock, Puzzle,
  Recycle, Scale, Shield, Skull, Sparkles, Sprout, Swords, Users, Wind, X, Zap,
} from 'lucide-react';
import { FORMATS, type FormatId } from '@/lib/data/catalog';
import { DECK_ARCHETYPES } from '@/lib/data/deck-archetypes';
import { getMainDeckMinSize, getSideboardMaxSize } from '@/lib/data/deck-utils';
import { FORMAT_MEDIA } from '@/lib/data/format-media';
import { createDeckSchema, type CreateDeckInput } from '@/lib/validations/deck';
import type { DeckArchetypeId } from '@/types/deck';
import { DECK_FORMAT_META } from './deck-format-meta';
import { StyledSelect } from './styled-select';

interface CreateDeckFormProps {
  onCreate: (input: CreateDeckInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ICON_CLASS = 'h-3.5 w-3.5';
const ARCHETYPE_META: Record<DeckArchetypeId, { icon: React.ReactNode; hint: string }> = {
  aggro: { icon: <Swords className={ICON_CLASS} />, hint: 'Pressione veloce' },
  control: { icon: <Shield className={ICON_CLASS} />, hint: 'Domina il late game' },
  combo: { icon: <Puzzle className={ICON_CLASS} />, hint: 'Assembla e chiudi' },
  midrange: { icon: <Scale className={ICON_CLASS} />, hint: 'Valore carta per carta' },
  tempo: { icon: <Wind className={ICON_CLASS} />, hint: 'Minacce e disturbo' },
  'aggro-combo': { icon: <Zap className={ICON_CLASS} />, hint: 'Aggressione esplosiva' },
  'combo-control': { icon: <Anchor className={ICON_CLASS} />, hint: 'Proteggi il motore' },
  ramp: { icon: <Sprout className={ICON_CLASS} />, hint: 'Mana e minacce enormi' },
  'prison-stax': { icon: <Lock className={ICON_CLASS} />, hint: 'Blocca le risorse' },
  dredge: { icon: <Recycle className={ICON_CLASS} />, hint: 'Gioca dal cimitero' },
  tribal: { icon: <Users className={ICON_CLASS} />, hint: 'Sinergie di tribù' },
  reanimator: { icon: <Skull className={ICON_CLASS} />, hint: 'Rianima presto' },
  storm: { icon: <CloudLightning className={ICON_CLASS} />, hint: 'Concatena magie' },
  burn: { icon: <Flame className={ICON_CLASS} />, hint: 'Danno diretto' },
  mill: { icon: <Layers className={ICON_CLASS} />, hint: 'Svuota il grimorio' },
  toolbox: { icon: <Hammer className={ICON_CLASS} />, hint: 'Risposte su misura' },
};

export function CreateDeckForm({ onCreate, onCancel, isSubmitting = false }: CreateDeckFormProps) {
  const [name, setName] = useState('');
  const [formatId, setFormatId] = useState<FormatId>(FORMATS[0].id);
  const [archetypeId, setArchetypeId] = useState<DeckArchetypeId>(DECK_ARCHETYPES[0].id);
  const [error, setError] = useState<string | null>(null);
  const target = getMainDeckMinSize(formatId);
  const side = getSideboardMaxSize(formatId);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    const parsed = createDeckSchema.safeParse({ name, formatId, archetypeId });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Dati non validi');
      return;
    }
    setError(null);
    onCreate(parsed.data);
  };

  const archetypeOptions = DECK_ARCHETYPES.map((archetype) => ({
    value: archetype.id,
    label: archetype.name,
    icon: ARCHETYPE_META[archetype.id].icon,
    hint: ARCHETYPE_META[archetype.id].hint,
  }));

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50">
      <div className="relative border-b border-white/10 px-5 py-5 sm:px-7">
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/[0.03] to-transparent" aria-hidden />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-display text-xl font-black uppercase tracking-wide text-white">Nuovo mazzo</p>
              <p className="mt-0.5 text-xs text-white/45">Impostalo ora, riempilo subito dopo.</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} disabled={isSubmitting} aria-label="Annulla creazione" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <div>
            <label htmlFor="deck-name" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Come lo chiami?</label>
            <input id="deck-name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Es. Mono Red Aggro" className="w-full rounded-2xl border border-white/15 bg-white/[0.055] px-4 py-3.5 text-base font-bold text-white placeholder:font-medium placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" autoFocus />
          </div>

          <fieldset>
            <legend className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Scegli il formato</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FORMATS.map((format) => {
                const selected = format.id === formatId;
                return (
                  <button key={format.id} type="button" onClick={() => setFormatId(format.id)} aria-pressed={selected} className={`group relative min-h-20 overflow-hidden rounded-2xl border text-left transition ${selected ? 'border-primary ring-2 ring-primary/25' : 'border-white/10 hover:-translate-y-0.5 hover:border-white/25'}`}>
                    <span className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105" style={{ backgroundImage: `url(${FORMAT_MEDIA[format.id].image})` }} aria-hidden />
                    <span className={`absolute inset-0 ${selected ? 'bg-gradient-to-t from-primary/85 via-black/55 to-black/20' : 'bg-gradient-to-t from-black/95 via-black/55 to-black/20'}`} aria-hidden />
                    <span className="relative flex min-h-20 flex-col justify-end p-2.5">
                      <span className="text-xs font-black uppercase text-white">{format.name}</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-white/55">{DECK_FORMAT_META[format.id].hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <aside className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Stile di gioco</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/35">È solo un’etichetta: scegli quella più vicina, potrai costruire liberamente.</p>
          <div className="mt-3">
            <StyledSelect value={archetypeId} onChange={setArchetypeId} options={archetypeOptions} placeholder="Scegli tipologia…" triggerClassName="h-12 rounded-xl px-3" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
              <span className="block font-display text-xl font-black text-white">{target}</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-white/35">Main deck</span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3">
              <span className="block font-display text-xl font-black text-white">{side}</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-white/35">Sideboard</span>
            </div>
          </div>

          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-white/55">
            Nel builder puoi incollare una decklist completa o aggiungere playset da 4 carte.
          </p>
          {error ? <p className="mt-3 text-xs font-semibold text-red-300" role="alert">{error}</p> : null}

          <button type="submit" disabled={isSubmitting} className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-red-500 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55">
            {isSubmitting ? 'Creazione…' : 'Apri il builder'}
            {!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
          </button>
        </aside>
      </div>
    </form>
  );
}
