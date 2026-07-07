'use client';

import { useState } from 'react';
import {
  Anchor,
  CloudLightning,
  Flame,
  Hammer,
  Layers,
  Lock,
  Puzzle,
  Recycle,
  Scale,
  Shield,
  Skull,
  Sprout,
  Swords,
  Users,
  Wind,
  Zap,
} from 'lucide-react';
import { FORMATS, type FormatId } from '@/lib/data/catalog';
import { DECK_ARCHETYPES } from '@/lib/data/deck-archetypes';
import { createDeckSchema, type CreateDeckInput } from '@/lib/validations/deck';
import { FormatPillSelect } from '@/components/feature/tornei/format-pill-select';
import type { DeckArchetypeId } from '@/types/deck';
import { StyledSelect } from './styled-select';

interface CreateDeckFormProps {
  onCreate: (input: CreateDeckInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/** Colore accento per formato — usato anche dalle card in deck-list. */
export const FORMAT_META: Record<FormatId, { color: string; hint: string }> = {
  'old-school': { color: '#a86b32', hint: '1993–1997 · carte originali' },
  premodern: { color: '#7a5a2e', hint: '1995–2003 · no border' },
  pioneer: { color: '#3b82f6', hint: 'da 2012 a oggi' },
  modern: { color: '#06b6d4', hint: 'da 2003 a oggi' },
  standard: { color: '#9aa3ad', hint: 'rotazione biennale' },
  legacy: { color: '#a855f7', hint: 'tutte le carte, no banlist ristretta' },
  pauper: { color: '#78d64b', hint: 'solo carte comuni · 60 carte' },
  commander: { color: '#22c55e', hint: '100 carte · multiplayer' },
};

const ARCHETYPE_ICON_CLASS = 'h-3.5 w-3.5';

/** Icona + strategia in una riga per ogni archetipo (niente pallini colorati). */
const ARCHETYPE_META: Record<DeckArchetypeId, { icon: React.ReactNode; hint: string }> = {
  aggro: { icon: <Swords className={ARCHETYPE_ICON_CLASS} />, hint: 'Pressione veloce, vittoria nei primi turni' },
  control: { icon: <Shield className={ARCHETYPE_ICON_CLASS} />, hint: 'Rispondi a tutto e domina il late game' },
  combo: { icon: <Puzzle className={ARCHETYPE_ICON_CLASS} />, hint: 'Assembla i pezzi, vinci in un colpo' },
  midrange: { icon: <Scale className={ARCHETYPE_ICON_CLASS} />, hint: 'Valore carta per carta' },
  tempo: { icon: <Wind className={ARCHETYPE_ICON_CLASS} />, hint: 'Minacce leggere + disturbo' },
  'aggro-combo': { icon: <Zap className={ARCHETYPE_ICON_CLASS} />, hint: 'Aggressione con finisher esplosivo' },
  'combo-control': { icon: <Anchor className={ARCHETYPE_ICON_CLASS} />, hint: 'Proteggi il motore, poi chiudi' },
  ramp: { icon: <Sprout className={ARCHETYPE_ICON_CLASS} />, hint: 'Mana in anticipo, minacce enormi' },
  'prison-stax': { icon: <Lock className={ARCHETYPE_ICON_CLASS} />, hint: 'Blocca le risorse avversarie' },
  dredge: { icon: <Recycle className={ARCHETYPE_ICON_CLASS} />, hint: 'Il cimitero è la tua mano' },
  tribal: { icon: <Users className={ARCHETYPE_ICON_CLASS} />, hint: 'Sinergie di tipo di creatura' },
  reanimator: { icon: <Skull className={ARCHETYPE_ICON_CLASS} />, hint: 'Rianima minacce giganti presto' },
  storm: { icon: <CloudLightning className={ARCHETYPE_ICON_CLASS} />, hint: 'Tante magie in un turno solo' },
  burn: { icon: <Flame className={ARCHETYPE_ICON_CLASS} />, hint: 'Danno diretto in faccia' },
  mill: { icon: <Layers className={ARCHETYPE_ICON_CLASS} />, hint: 'Svuota il grimorio avversario' },
  toolbox: { icon: <Hammer className={ARCHETYPE_ICON_CLASS} />, hint: 'Risposte su misura da cercare' },
};

export function CreateDeckForm({ onCreate, onCancel, isSubmitting = false }: CreateDeckFormProps) {
  const [name, setName] = useState('');
  const [formatId, setFormatId] = useState<FormatId>(FORMATS[0].id);
  const [archetypeId, setArchetypeId] = useState<DeckArchetypeId>(DECK_ARCHETYPES[0].id);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const parsed = createDeckSchema.safeParse({ name, formatId, archetypeId });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Dati non validi');
      return;
    }
    setError(null);
    onCreate(parsed.data);
  };

  const archetypeOptions = DECK_ARCHETYPES.map((a) => ({
    value: a.id,
    label: a.name,
    icon: ARCHETYPE_META[a.id]?.icon,
    hint: ARCHETYPE_META[a.id]?.hint,
  }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="deck-name" className="text-xs font-bold uppercase tracking-wide text-white/70">
          Nome mazzo
        </label>
        <input
          id="deck-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Es. Mono Red Aggro"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FF7300] focus:outline-none"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <p
            id="deck-format-label"
            className="text-xs font-bold uppercase tracking-wide text-white/70"
          >
            Formato
          </p>
          <FormatPillSelect
            value={formatId}
            onChange={setFormatId}
            ariaLabelledBy="deck-format-label"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-white/70">Tipologia</p>
          <StyledSelect
            value={archetypeId}
            onChange={(v) => setArchetypeId(v)}
            options={archetypeOptions}
            placeholder="Scegli tipologia…"
            triggerClassName="h-14 rounded-full px-4"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-300">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creazione…' : 'Crea mazzo'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}
