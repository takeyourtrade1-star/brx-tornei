'use client';

import { useCallback, useState, useTransition, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { createDeckAction } from '@/actions/decks';
import { validateDeckBuilderStep } from '@/lib/validations/deck';
import { BuilderStepIndicator } from './builder-step-indicator';
import { DeckBuilderSidebar } from './deck-builder-sidebar';
import { DeckSidebarDrawer } from './deck-sidebar-drawer';
import { CardSearchPanel } from './card-search-panel';
import { InfoStep } from './steps/info-step';
import { ConfirmStep } from './steps/confirm-step';
import { addCardToZone, removeCardFromZone } from './deck-card-helpers';
import {
  BUILDER_STEPS,
  type BuilderStepId,
  type CreateDeckBuilderProps,
  type CreateDeckFormState,
  type DeckZone,
} from './builder-types';

function buildInitialState(format: CreateDeckFormState['format']): CreateDeckFormState {
  return { name: '', format, main: [], sideboard: [] };
}

function activeZoneForStep(step: BuilderStepId): DeckZone | 'all' {
  if (step === 'main') return 'main';
  if (step === 'side') return 'sideboard';
  return 'all';
}

export function CreateDeckBuilder({
  initialFormat,
  catalogCards,
}: CreateDeckBuilderProps) {
  const [step, setStep] = useState<BuilderStepId>('info');
  const [values, setValues] = useState<CreateDeckFormState>(() => buildInitialState(initialFormat));
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const stepIndex = BUILDER_STEPS.findIndex((s) => s.id === step);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === BUILDER_STEPS.length - 1;
  const activeZone = activeZoneForStep(step);

  const handleChange = useCallback((patch: Partial<CreateDeckFormState>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleAddCard = useCallback(
    (zone: DeckZone, card: (typeof catalogCards)[number]) => {
      setValues((prev) => ({
        ...prev,
        [zone]: addCardToZone(prev[zone], card),
      }));
    },
    []
  );

  const handleRemoveCard = useCallback((zone: DeckZone, cardId: string) => {
    setValues((prev) => ({
      ...prev,
      [zone]: removeCardFromZone(prev[zone], cardId),
    }));
  }, []);

  function goNext() {
    setError(null);
    const validation = validateDeckBuilderStep(step, values);
    if (!validation.success) {
      setError(validation.error);
      return;
    }
    if (!isLast) setStep(BUILDER_STEPS[stepIndex + 1]!.id);
  }

  function goBack() {
    setError(null);
    if (!isFirst) setStep(BUILDER_STEPS[stepIndex - 1]!.id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validation = validateDeckBuilderStep('confirm', values);
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    const formData = new FormData();
    formData.set('name', values.name);
    formData.set('format', values.format);
    formData.set('main', JSON.stringify(values.main));
    formData.set('sideboard', JSON.stringify(values.sideboard));

    startTransition(async () => {
      const result = await createDeckAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="lg:grid lg:grid-cols-[minmax(280px,320px)_1fr] lg:items-start lg:gap-6">
        <div className="hidden lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-7rem)]">
          <DeckBuilderSidebar
            values={values}
            activeZone={activeZone}
            onRemove={handleRemoveCard}
            onNameChange={(name) => handleChange({ name })}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <BuilderStepIndicator currentStep={step} />

          <div className="brx-glass rounded-3xl border border-white/15 p-6 sm:p-8">
            {step === 'info' && <InfoStep values={values} onChange={handleChange} />}
            {step === 'main' && (
              <CardSearchPanel
                catalogCards={catalogCards}
                zone="main"
                zoneLabel="main deck"
                onAdd={(card) => handleAddCard('main', card)}
              />
            )}
            {step === 'side' && (
              <CardSearchPanel
                catalogCards={catalogCards}
                zone="sideboard"
                zoneLabel="sideboard"
                onAdd={(card) => handleAddCard('sideboard', card)}
              />
            )}
            {step === 'confirm' && <ConfirmStep values={values} />}
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
                  'Crea mazzo'
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
        </div>
      </div>

      <DeckSidebarDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        values={values}
        activeZone={activeZone}
        onRemove={handleRemoveCard}
        onNameChange={(name) => handleChange({ name })}
      />
    </form>
  );
}
