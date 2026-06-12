import { cn } from '@/lib/utils';
import { BUILDER_STEPS, type BuilderStepId } from './builder-types';

interface BuilderStepIndicatorProps {
  currentStep: BuilderStepId;
}

export function BuilderStepIndicator({ currentStep }: BuilderStepIndicatorProps) {
  const currentIndex = BUILDER_STEPS.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Progresso creazione mazzo" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 sm:gap-3">
        {BUILDER_STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-sm font-bold transition-colors',
                    isComplete && 'bg-primary text-primary-foreground',
                    isCurrent && 'brx-liquid-glass-circle text-white ring-2 ring-marquee',
                    !isComplete && !isCurrent && 'bg-white/10 text-white/40 ring-1 ring-white/15'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                <span
                  className={cn(
                    'hidden font-sans text-xs font-bold uppercase tracking-wider sm:inline',
                    isCurrent ? 'text-white' : 'text-white/45'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < BUILDER_STEPS.length - 1 && (
                <span className="hidden h-px w-6 bg-white/20 sm:block" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
