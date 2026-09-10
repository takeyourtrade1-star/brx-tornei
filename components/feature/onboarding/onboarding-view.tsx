import { LandingBackgroundVideo } from '@/components/feature/landing/LandingBackgroundVideo';
import { ArenaAtmosphere } from '@/components/layout/arena-atmosphere';
import { OnboardingHeader } from './onboarding-header';
import { OnboardingForm } from './onboarding-form';

interface OnboardingViewProps {
  userName?: string | null;
  userEmail?: string | null;
  initialGamertag: string | null;
  suggestedGamertag?: string | null;
  redirectTo: string;
  qualifyingMatches: number;
}

/**
 * Schermata di Onboarding: atmosfera da torneo (ArenaAtmosphere + Video),
 * header dedicato e card profilo duellante interattiva con anteprima live.
 */
export function OnboardingView({
  userName,
  userEmail,
  initialGamertag,
  suggestedGamertag,
  redirectTo,
  qualifyingMatches,
}: OnboardingViewProps) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0F1D] text-slate-100 antialiased">
      {/* Sfondo video di carte TCG */}
      <LandingBackgroundVideo />

      {/* Gradienti scuri di profondità e contrasto */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#0F172A]/85 via-[#0A0F1D]/80 to-[#060A14]/90"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(61,101,198,0.25),transparent_70%)]"
        aria-hidden
      />

      {/* Atmosfera dell'arena tornei: focolare 3D, fasci e brace fluttuante */}
      <ArenaAtmosphere />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header di navigazione con brand e ritorno a Ebartex */}
        <OnboardingHeader userEmail={userEmail} />

        {/* Contenitore principale centrato sul profilo e gamertag */}
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
          <OnboardingForm
            userName={userName}
            initialGamertag={initialGamertag}
            suggestedGamertag={suggestedGamertag}
            redirectTo={redirectTo}
            qualifyingMatches={qualifyingMatches}
          />
        </main>
      </div>
    </div>
  );
}
