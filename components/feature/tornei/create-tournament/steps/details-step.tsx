'use client';

import { Users } from 'lucide-react';
import { getParticipantPresets, isHeadsUpMode } from '@/lib/data/catalog';
import { WizardOptionCard } from '../wizard-option-card';
import type { CreateTournamentFormState, TournamentVisibility } from '../wizard-types';

interface DetailsStepProps {
  values: CreateTournamentFormState;
  onChange: (patch: Partial<CreateTournamentFormState>) => void;
}

export function DetailsStep({ values, onChange }: DetailsStepProps) {
  const presets = getParticipantPresets(values.mode);
  const headsUp = isHeadsUpMode(values.mode);

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Partecipanti
        </h2>
        <p className="mt-1 text-sm text-white/60">
          {headsUp
            ? 'In modalità Heads-Up il torneo è sempre 1 contro 1 (2 giocatori).'
            : 'Scegli quanti giocatori possono iscriversi al torneo.'}
        </p>

        {headsUp ? (
          <div className="mt-4">
            <WizardOptionCard
              title="2 giocatori"
              description="Fisso per Heads-Up: tu e un avversario."
              selected
              disabled
              badge="Automatico"
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {presets.map((preset) => (
              <WizardOptionCard
                key={preset.value}
                title={String(preset.value)}
                description={preset.label}
                selected={values.maxPlayers === preset.value}
                onClick={() => onChange({ maxPlayers: preset.value })}
              />
            ))}
          </div>
        )}

        {headsUp && (
          <p className="mt-3 flex items-center gap-2 text-sm text-white/50">
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            Il conteggio partecipanti non è modificabile in questa modalità.
          </p>
        )}
      </div>

      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Visibilità stanza
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Una stanza pubblica è visibile a tutti; quella privata richiede invito o approvazione.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <VisibilityCard
            visibility="public"
            selected={values.visibility === 'public'}
            onSelect={() => onChange({ visibility: 'public' })}
          />
          <VisibilityCard
            visibility="private"
            selected={values.visibility === 'private'}
            onSelect={() => onChange({ visibility: 'private' })}
          />
        </div>
      </div>
    </section>
  );
}

function VisibilityCard({
  visibility,
  selected,
  onSelect,
}: {
  visibility: TournamentVisibility;
  selected: boolean;
  onSelect: () => void;
}) {
  const isPublic = visibility === 'public';

  return (
    <WizardOptionCard
      title={isPublic ? 'Pubblica' : 'Privata'}
      description={
        isPublic
          ? 'Chiunque può vedere il torneo e iscriversi liberamente.'
          : 'Solo su invito: gli altri devono chiedere di partecipare.'
      }
      selected={selected}
      onClick={onSelect}
      badge={isPublic ? undefined : 'Invito'}
    />
  );
}
