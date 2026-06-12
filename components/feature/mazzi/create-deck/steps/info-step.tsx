'use client';

import { FORMATS } from '@/lib/data/catalog';
import { WizardOptionCard } from '@/components/feature/tornei/create-tournament/wizard-option-card';
import type { CreateDeckFormState } from '../builder-types';

interface InfoStepProps {
  values: CreateDeckFormState;
  onChange: (patch: Partial<CreateDeckFormState>) => void;
}

export function InfoStep({ values, onChange }: InfoStepProps) {
  return (
    <section className="flex flex-col gap-8">
      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Nome mazzo
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Puoi modificarlo in qualsiasi momento durante la creazione.
        </p>
        <input
          type="text"
          value={values.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="Es. Izzet Murktide"
          maxLength={80}
          className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-marquee/50 focus:outline-none focus:ring-2 focus:ring-marquee/30"
        />
      </div>

      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Formato
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Il formato determina il minimo di carte nel main deck (60 o 100 per Commander).
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FORMATS.map((format) => (
            <WizardOptionCard
              key={format.id}
              title={format.name}
              description={
                format.id === 'commander' ? 'Main deck: minimo 100 carte' : 'Main deck: minimo 60 carte'
              }
              selected={values.format === format.id}
              onClick={() => onChange({ format: format.id })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
