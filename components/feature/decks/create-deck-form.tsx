'use client';

import { useState } from 'react';
import { FORMATS, type FormatId } from '@/lib/data/catalog';
import { DECK_ARCHETYPES } from '@/lib/data/deck-archetypes';
import { createDeckSchema, type CreateDeckInput } from '@/lib/validations/deck';
import type { DeckArchetypeId } from '@/types/deck';
import { StyledSelect } from './styled-select';

interface CreateDeckFormProps {
  onCreate: (input: CreateDeckInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

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

const ARCHETYPE_META: Record<DeckArchetypeId, { color: string }> = {
  aggro: { color: '#d94f46' },
  control: { color: '#4a7fd6' },
  combo: { color: '#9a6ad6' },
  midrange: { color: '#5da24e' },
  tempo: { color: '#38bdf8' },
  'aggro-combo': { color: '#e0564d' },
  'combo-control': { color: '#7c3aed' },
  ramp: { color: '#f2b94b' },
  'prison-stax': { color: '#a16207' },
  dredge: { color: '#7c2d12' },
  tribal: { color: '#f97316' },
  reanimator: { color: '#581c87' },
  storm: { color: '#0ea5e9' },
  burn: { color: '#ef4444' },
  mill: { color: '#64748b' },
  toolbox: { color: '#14b8a6' },
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

  const formatOptions = FORMATS.map((f) => ({
    value: f.id,
    label: f.name,
    color: FORMAT_META[f.id]?.color,
    hint: FORMAT_META[f.id]?.hint,
  }));
  const archetypeOptions = DECK_ARCHETYPES.map((a) => ({
    value: a.id,
    label: a.name,
    color: ARCHETYPE_META[a.id]?.color,
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
          <label htmlFor="deck-format" className="text-xs font-bold uppercase tracking-wide text-white/70">
            Formato
          </label>
          <StyledSelect
            value={formatId}
            onChange={(v) => setFormatId(v)}
            options={formatOptions}
            placeholder="Scegli formato…"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="deck-archetype" className="text-xs font-bold uppercase tracking-wide text-white/70">
            Tipologia
          </label>
          <StyledSelect
            value={archetypeId}
            onChange={(v) => setArchetypeId(v)}
            options={archetypeOptions}
            placeholder="Scegli tipologia…"
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
