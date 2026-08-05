import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { sanitizeRedirect } from '@/lib/auth/redirect';
import { fetchMyGamertag } from '@/lib/data/player-api-client';
import { SetGamertagView } from './set-gamertag-view';

export const metadata: Metadata = { title: 'Imposta il tuo gamertag' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ImpostaUsernamePage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const rawRedirect = typeof params.redirect === 'string' ? params.redirect : null;
  const redirectTo = sanitizeRedirect(rawRedirect);

  const currentGamertag = await fetchMyGamertag();

  return <SetGamertagView initialGamertag={currentGamertag} redirectTo={redirectTo} />;
}
