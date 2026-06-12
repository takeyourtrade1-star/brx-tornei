'use client';

import type { FormatId, ModeId, BestOfId } from '@/lib/data/catalog';
import { BEST_OF_OPTIONS } from '@/lib/data/catalog';
import { WizardOptionCard } from '../wizard-option-card';
import type { CreateTournamentFormState } from '../wizard-types';

interface FormatCatalogItem {
  id: FormatId;
  name: string;
}

interface ModeCatalogItem {
  id: ModeId;
  name: string;
  description: string;
  available: boolean;
  badge?: string;
}

interface FormatStepProps {
  formats: readonly FormatCatalogItem[];
  modes: readonly ModeCatalogItem[];
  values: CreateTournamentFormState;
  onChange: (patch: Partial<CreateTournamentFormState>) => void;
}

export function FormatStep({ formats, modes, values, onChange }: FormatStepProps) {
  return (
    <section className="flex flex-col gap-8">
      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Formato di gioco
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Scegli il formato Magic in cui si svolgerà il torneo.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {formats.map((format) => (
            <WizardOptionCard
              key={format.id}
              title={format.name}
              selected={values.format === format.id}
              onClick={() => onChange({ format: format.id })}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Modalità torneo
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Heads-Up per sfide 1v1; altre modalità in arrivo.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {modes.map((mode) => (
            <WizardOptionCard
              key={mode.id}
              title={mode.name}
              description={mode.description}
              selected={values.mode === mode.id}
              disabled={!mode.available}
              badge={mode.badge}
              onClick={() => mode.available && onChange({ mode: mode.id })}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Stato / Forma
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Quante partite servono per vincere il match.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BEST_OF_OPTIONS.map((option) => (
            <WizardOptionCard
              key={option.id}
              title={option.label}
              description={option.description}
              selected={values.bestOf === option.id}
              onClick={() => onChange({ bestOf: option.id as BestOfId })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
