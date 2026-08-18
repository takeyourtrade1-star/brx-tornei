import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { sanitizeRedirect } from '@/lib/auth/redirect';
import { fetchMyGamertag } from '@/lib/data/player-api-client';
import { OnboardingView } from '@/components/feature/onboarding/onboarding-view';

export const metadata: Metadata = {
  title: 'Benvenuto nei Tornei Ebartex',
  description: 'Configura il tuo profilo duellante, consulta la guida e scendi in campo nei tornei TCG.',
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const GAMERTAG_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export default async function ImpostaUsernamePage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const rawRedirect = typeof params.redirect === 'string' ? params.redirect : null;
  const redirectTo = sanitizeRedirect(rawRedirect);

  const currentGamertag = await fetchMyGamertag();
  const userName = session.user.name;
  const userEmail = session.user.email;

  // Suggerisci il nome utente Ebartex se valido come gamertag
  const suggestedGamertag =
    !currentGamertag && userName && GAMERTAG_PATTERN.test(userName) ? userName : null;

  return (
    <OnboardingView
      userName={userName}
      userEmail={userEmail}
      initialGamertag={currentGamertag}
      suggestedGamertag={suggestedGamertag}
      redirectTo={redirectTo}
    />
  );
}

