import { OnboardingForm } from './onboarding-form';

interface OnboardingViewProps {
  initialGamertag: string | null;
  redirectTo: string;
  qualifyingMatches: number;
}

/** Una sola card per scegliere l'identità del duellante. */
export function OnboardingView(props: OnboardingViewProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-header-bg px-4 py-8 font-sans sm:py-12">
      <OnboardingForm {...props} />
    </main>
  );
}
