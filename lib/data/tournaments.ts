import 'server-only';

import { FORMATS } from '@/lib/data/catalog';
import type { Participant, Tournament, JoinTournamentResult } from '@/types/tournament';
import type { Selection } from '@/lib/validations/selection';
import {
  fetchTournamentById,
  fetchTournaments,
  isTournamentsApiEnabled,
  postJoinTournament,
  postLeaveTournament,
  postReadyTournament,
  postCreateTournament,
  TournamentApiError,
} from '@/lib/data/tournament-api-client';
import type { CreateTournamentInput } from '@/lib/validations/tournament';

/**
 * Data layer tornei — confine col backend.
 * Il servizio è online: nessun fallback mock, i dati arrivano solo dall'API.
 */

function byRecent(a: Tournament, b: Tournament): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export async function getTournaments(selection: Selection): Promise<Tournament[]> {
  // "Tutti i formati" non esiste per il Tournament Service: l'API accetta solo
  // formati espliciti, quindi si chiede un elenco per ciascun formato e si
  // uniscono i risultati (dedup per id). Un singolo formato non risponde non
  // blocca la vista: restano i tavoli degli altri formati.
  if (selection.format === 'all') {
    const settled = await Promise.allSettled(
      FORMATS.map((format) => fetchTournaments({ ...selection, format: format.id })),
    );
    const seen = new Map<string, Tournament>();
    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;
      for (const tournament of result.value) {
        if (!seen.has(tournament.id)) seen.set(tournament.id, tournament);
      }
    }
    return [...seen.values()].sort(byRecent);
  }
  return fetchTournaments(selection);
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  return fetchTournamentById(id);
}

export async function createTournament(
  input: CreateTournamentInput,
  _creator: Participant,
): Promise<Tournament> {
  return postCreateTournament(input);
}

export async function joinTournament(
  id: string,
  _participant: Participant,
): Promise<JoinTournamentResult> {
  return postJoinTournament(id);
}

export async function leaveTournament(id: string): Promise<void> {
  await postLeaveTournament(id);
}

export async function readyTournament(
  id: string,
  ready: boolean,
): Promise<JoinTournamentResult> {
  return postReadyTournament(id, ready);
}

export { TournamentApiError, isTournamentsApiEnabled };
