'use client';

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
  userName,
  userEmail,
  qualifyingMatches = 0,
}: SetGamertagViewProps) {
  return (
    <OnboardingView
      userName={userName}
      userEmail={userEmail}
      initialGamertag={initialGamertag}
      redirectTo={redirectTo}
      qualifyingMatches={qualifyingMatches}
    />
  );
}
