import { Globe, Lock } from 'lucide-react';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import { BEST_OF_OPTIONS } from '@/lib/data/catalog';
import type { CreateTournamentFormState } from '../wizard-types';

interface CatalogLabels {
  formats: readonly { id: FormatId; name: string }[];
  modes: readonly { id: ModeId; name: string }[];
}

interface ConfirmStepProps {
  values: CreateTournamentFormState;
  catalog: CatalogLabels;
}

export function ConfirmStep({ values, catalog }: ConfirmStepProps) {
  const formatName = catalog.formats.find((f) => f.id === values.format)?.name ?? values.format;
  const modeName = catalog.modes.find((m) => m.id === values.mode)?.name ?? values.mode;
  const bestOfLabel =
    BEST_OF_OPTIONS.find((b) => b.id === values.bestOf)?.label ?? values.bestOf;

  const rows = [
    { label: 'Buy-in', value: 'For Fun' },
    { label: 'Formato di gioco', value: formatName },
    { label: 'Modalità torneo', value: modeName },
    { label: 'Stato / Forma', value: bestOfLabel },
    { label: 'Partecipanti max', value: String(values.maxPlayers) },
    {
      label: 'Visibilità',
      value: values.visibility === 'public' ? 'Pubblica' : 'Privata',
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Riepilogo
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Controlla i dettagli prima di creare il torneo.
        </p>
      </div>

      <dl className="divide-y divide-white/10 rounded-2xl border border-white/15 bg-white/5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <dt className="text-sm text-white/55">{row.label}</dt>
            <dd className="flex items-center gap-2 font-sans text-sm font-bold text-white">
              {row.label === 'Visibilità' &&
                (values.visibility === 'public' ? (
                  <Globe className="h-4 w-4 text-marquee" aria-hidden />
                ) : (
                  <Lock className="h-4 w-4 text-amber-400" aria-hidden />
                ))}
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
