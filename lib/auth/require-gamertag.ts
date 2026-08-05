import 'server-only';

import { redirect } from 'next/navigation';
import { fetchMyGamertag } from '@/lib/data/player-api-client';

/**
 * Gate UX, non l'unico: il vero gate è il 409 GAMERTAG_REQUIRED del backend
 * su create/join. Va chiamato DOPO aver verificato la sessione (richiede un
 * accessToken valido per leggere il profilo).
 */
export async function requireGamertag(returnTo: string): Promise<void> {
  const gamertag = await fetchMyGamertag();
  if (gamertag) return;
  redirect(`/imposta-username?redirect=${encodeURIComponent(returnTo)}`);
}
