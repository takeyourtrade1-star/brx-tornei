import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { sanitizeRedirect } from '@/lib/auth/redirect';
import { fetchMyGamertag, fetchMyReputation } from '@/lib/data/player-api-client';
import { OnboardingView } from '@/components/feature/onboarding/onboarding-view';

export const metadata: Metadata = {
  title: 'Benvenuto nei Tornei Ebartex',
  description: 'Scegli il tuo gamertag e la tua icona per i tornei TCG.',
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ImpostaUsernamePage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const rawRedirect = typeof params.redirect === 'string' ? params.redirect : null;
  const redirectTo = sanitizeRedirect(rawRedirect);

  const [currentGamertag, reputation] = await Promise.all([
    fetchMyGamertag(),
    fetchMyReputation().catch(() => null),
  ]);
  return (
    <OnboardingView
      initialGamertag={currentGamertag}
      redirectTo={redirectTo}
      qualifyingMatches={reputation?.qualifiedMatches30m ?? 0}
    />
  );
}
