'use client';

import { LandingBackgroundVideo } from '@/components/feature/landing/LandingBackgroundVideo';
import { OnboardingHeader } from './onboarding-header';
import { OnboardingGuide } from './onboarding-guide';
import { OnboardingForm } from './onboarding-form';

interface OnboardingViewProps {
  userName?: string | null;
  userEmail?: string | null;
  initialGamertag: string | null;
  suggestedGamertag?: string | null;
  redirectTo: string;
}

/**
 * Vista completa di Onboarding e Benvenuto ai Tornei Ebartex.
 */
export function OnboardingView({
  userName,
  userEmail,
  initialGamertag,
  suggestedGamertag,
  redirectTo,
}: OnboardingViewProps) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0F1D] text-slate-100 antialiased">
      {/* Video / Background atmosferico */}
      <LandingBackgroundVideo />

      {/* Gradienti e texture sovrapposti per massima leggibilità */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#0F172A]/90 via-[#0A0F1D]/85 to-[#060A14]/95"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(61,101,198,0.3),transparent_70%)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header di navigazione */}
        <OnboardingHeader userEmail={userEmail} />

        {/* Contenuto Hero Principale */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Colonna Sinistra: Benvenuto e Mini Guida */}
            <section className="lg:col-span-7 xl:col-span-7">
              <OnboardingGuide userName={userName} />
            </section>

            {/* Colonna Destra: Card Preview + Form Interattivo */}
            <section className="lg:col-span-5 xl:col-span-5">
              <div className="mx-auto max-w-md lg:max-w-none">
                <OnboardingForm
                  initialGamertag={initialGamertag}
                  suggestedGamertag={suggestedGamertag}
                  redirectTo={redirectTo}
                />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
