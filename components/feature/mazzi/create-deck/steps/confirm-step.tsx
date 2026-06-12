'use client';

import { getFormat } from '@/lib/data/catalog';
import {
  SIDEBOARD_SIZE,
  countDeckCards,
  getMinMainDeckSize,
} from '@/lib/validations/deck';
import type { CreateDeckFormState } from '../builder-types';

interface ConfirmStepProps {
  values: CreateDeckFormState;
}

export function ConfirmStep({ values }: ConfirmStepProps) {
  const format = getFormat(values.format);
  const minMain = getMinMainDeckSize(values.format);
  const mainCount = countDeckCards(values.main);
  const sideCount = countDeckCards(values.sideboard);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Riepilogo
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Controlla i dati prima di salvare il mazzo.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-white/50">Nome</dt>
          <dd className="mt-1 font-display text-lg font-bold text-white">
            {values.name.trim() || '—'}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-white/50">Formato</dt>
          <dd className="mt-1 font-display text-lg font-bold text-white">
            {format?.name ?? values.format}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-white/50">Main deck</dt>
          <dd className="mt-1 font-mono text-lg font-bold text-emerald-300">
            {mainCount} carte <span className="text-sm text-white/50">(min {minMain})</span>
          </dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-white/50">Sideboard</dt>
          <dd className="mt-1 font-mono text-lg font-bold text-emerald-300">
            {sideCount} carte <span className="text-sm text-white/50">(target {SIDEBOARD_SIZE})</span>
          </dd>
        </div>
      </dl>

      <p className="text-sm text-white/55">
        Il sideboard sarà disponibile dalla seconda partita in poi nei match al meglio di tre o
        cinque.
      </p>
    </section>
  );
}
