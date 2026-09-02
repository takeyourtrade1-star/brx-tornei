import 'server-only';

import { redirect } from 'next/navigation';
import { fetchMyGamertag, readLastKnownGamertag } from '@/lib/data/player-api-client';
import { TournamentApiError } from '@/lib/data/tournament-api-client';

/**
 * Gate UX, non l'unico: il vero gate è il 409 GAMERTAG_REQUIRED del backend
 * su create/join. Va chiamato DOPO aver verificato la sessione (richiede un
 * accessToken valido per leggere il profilo).
 *
 * Restituisce il gamertag: chi supera il gate lo ha già in mano e può
 * mostrarlo al posto di email/username Ebartex senza una seconda chiamata.
 */
export async function requireGamertag(returnTo: string): Promise<string> {
  let gamertag: string | null = null;
  try {
    gamertag = await fetchMyGamertag();
  } catch (err) {
    if (err instanceof TournamentApiError && err.status === 401) {
      redirect('/login');
    }
    // Un 429 o un 5xx non sono un profilo mancante: girava un throw fino al
    // boundary e l'intera lobby diventava "connessione interrotta". Se il
    // gamertag di questa sessione è già noto la pagina resta in piedi.
    if (isTransientProfileError(err)) {
      const lastKnown = await readLastKnownGamertag();
      if (lastKnown) return lastKnown;
    }
    throw err;
  }
  if (gamertag) return gamertag;
  redirect(`/imposta-username?redirect=${encodeURIComponent(returnTo)}`);
}

/** Errore del backend che non dice nulla sul profilo: vale ritentare dopo. */
function isTransientProfileError(err: unknown): boolean {
  return (
    err instanceof TournamentApiError && (err.status === 429 || err.status >= 500)
  );
}
