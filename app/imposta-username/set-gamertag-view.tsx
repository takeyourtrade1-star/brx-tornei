import { OnboardingView } from '@/components/feature/onboarding/onboarding-view';

interface SetGamertagViewProps {
  initialGamertag: string | null;
  redirectTo: string;
  userName?: string | null;
  userEmail?: string | null;
  qualifyingMatches?: number;
}

/**
 * Wrapper retrocompatibile per la vista di impostazione gamertag e onboarding.
 */
export function SetGamertagView({
  initialGamertag,
  redirectTo,
  qualifyingMatches = 0,
}: SetGamertagViewProps) {
  return (
    <OnboardingView
      initialGamertag={initialGamertag}
      redirectTo={redirectTo}
      qualifyingMatches={qualifyingMatches}
    />
  );
}
