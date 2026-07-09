import 'server-only';

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

export async function getTournaments(selection: Selection): Promise<Tournament[]> {
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
