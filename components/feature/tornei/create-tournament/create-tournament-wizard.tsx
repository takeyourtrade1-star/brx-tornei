'use client';

import { useCallback, useState, useTransition, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { createTournamentAction } from '@/actions/tournaments';
import {
  FORMATS,
  MODES,
  getDefaultMaxPlayers,
  isHeadsUpMode,
  type FormatId,
  type ModeId,
} from '@/lib/data/catalog';
import { validateCreateTournamentInput } from '@/lib/validations/tournament';
import { WizardStepIndicator } from './wizard-step-indicator';
import { BuyInStep } from './steps/buy-in-step';
import { FormatStep } from './steps/format-step';
import { DetailsStep } from './steps/details-step';
import { ConfirmStep } from './steps/confirm-step';
import {
  WIZARD_STEPS,
  type CreateTournamentFormState,
  type WizardStepId,
} from './wizard-types';

interface CreateTournamentWizardProps {
  initialFormat: FormatId;
  initialMode: ModeId;
}

function buildInitialState(format: FormatId, mode: ModeId): CreateTournamentFormState {
  return {
    buyIn: 'for_fun',
    format,
    mode,
    bestOf: 'BO3',
    maxPlayers: getDefaultMaxPlayers(mode),
    visibility: 'public',
  };
}

export function CreateTournamentWizard({ initialFormat, initialMode }: CreateTournamentWizardProps) {
  const [step, setStep] = useState<WizardStepId>('buy-in');
  const [values, setValues] = useState<CreateTournamentFormState>(() =>
    buildInitialState(initialFormat, initialMode)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === step);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === WIZARD_STEPS.length - 1;

  const handleChange = useCallback((patch: Partial<CreateTournamentFormState>) => {
    setValues((prev) => {
      const next = { ...prev, ...patch };
      if (patch.mode && isHeadsUpMode(patch.mode)) {
        next.maxPlayers = 2;
      }
      return next;
    });
  }, []);

  function goNext() {
    setError(null);
    if (!isLast) {
      setStep(WIZARD_STEPS[stepIndex + 1]!.id);
    }
  }

  function goBack() {
    setError(null);
    if (!isFirst) {
      setStep(WIZARD_STEPS[stepIndex - 1]!.id);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validation = validateCreateTournamentInput(values);
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    const formData = new FormData();
    formData.set('format', validation.data.format);
    formData.set('mode', validation.data.mode);
    formData.set('buyIn', validation.data.buyIn);
    formData.set('bestOf', validation.data.bestOf);
    formData.set('maxPlayers', String(validation.data.maxPlayers));
    formData.set('visibility', validation.data.visibility);

    startTransition(async () => {
      const result = await createTournamentAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <WizardStepIndicator currentStep={step} />

      <div className="brx-glass rounded-3xl border border-white/15 p-6 sm:p-8">
        {step === 'buy-in' && <BuyInStep />}
        {step === 'format' && (
          <FormatStep
            formats={FORMATS}
            modes={MODES}
            values={values}
            onChange={handleChange}
          />
        )}
        {step === 'details' && <DetailsStep values={values} onChange={handleChange} />}
        {step === 'confirm' && (
          <ConfirmStep values={values} catalog={{ formats: FORMATS, modes: MODES }} />
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={isFirst || isPending}
          className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Indietro
        </button>

        {isLast ? (
          <button
            type="submit"
            disabled={isPending}
            className="brx-liquid-glass-btn flex items-center gap-2 rounded-full px-6 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-white disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creazione…
              </>
            ) : (
              'Crea torneo'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="brx-liquid-glass-btn flex items-center gap-2 rounded-full px-6 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-white"
          >
            Avanti
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
