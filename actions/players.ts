'use server';

import { getSession } from '@/lib/auth/session';
import {
  fetchGamertagAvailability,
  postSetGamertag,
  TournamentApiError,
  type GamertagAvailability,
} from '@/lib/data/player-api-client';

export interface SetGamertagState {
  ok?: true;
  gamertag?: string;
  error?: string;
  errorCode?: string;
}

const GAMERTAG_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

function mapApiError(err: unknown, fallback: string): SetGamertagState {
  if (err instanceof TournamentApiError) {
    const messages: Record<string, string> = {
      GAMERTAG_TAKEN: 'Questo gamertag è già in uso: provane un altro.',
      API_NOT_CONFIGURED: 'Servizio tornei non configurato.',
      API_UNAVAILABLE: 'Il servizio tornei non è raggiungibile. Riprova tra poco.',
    };
    return {
      error: (err.code && messages[err.code]) || err.message || fallback,
      errorCode: err.code,
    };
  }
  if (err instanceof Error) return { error: err.message };
  return { error: fallback };
}

/** Imposta (o cambia) il gamertag torneo-only dell'utente. */
export async function setGamertagAction(gamertag: string): Promise<SetGamertagState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  const trimmed = gamertag.trim();
  if (!GAMERTAG_PATTERN.test(trimmed)) {
    return { error: 'Il gamertag deve avere 3-20 caratteri: lettere, numeri e underscore.' };
  }

  try {
    const saved = await postSetGamertag(trimmed);
    return { ok: true, gamertag: saved };
  } catch (err) {
    return mapApiError(err, 'Impossibile salvare il gamertag');
  }
}

const UNAVAILABLE_FALLBACK: GamertagAvailability = {
  available: false,
  normalizedGamertag: '',
  validFormat: false,
};

/** Verifica live (mentre l'utente digita) se un gamertag è libero. */
export async function checkGamertagAvailabilityAction(
  gamertag: string,
): Promise<GamertagAvailability> {
  const session = await getSession();
  if (!session) return UNAVAILABLE_FALLBACK;

  try {
    return await fetchGamertagAvailability(gamertag);
  } catch {
    return UNAVAILABLE_FALLBACK;
  }
}
