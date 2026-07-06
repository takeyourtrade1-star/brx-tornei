import 'server-only';

import type { Participant, Tournament, JoinTournamentResult } from '@/types/tournament';
import type { Selection } from '@/lib/validations/selection';
import type { CreateTournamentInput } from '@/lib/validations/tournament';
import {
  fetchTournamentById,
  fetchTournaments,
  isTournamentsApiEnabled,
  postCreateTournament,
  postJoinTournament,
  TournamentApiError,
} from '@/lib/data/tournament-api-client';
import {
  mockAddTournament,
  mockCreateTournament,
  mockGetTournamentById,
  mockGetTournaments,
  mockJoinTournament,
  mockJoinTournamentLegacy,
} from '@/lib/data/tournaments-mock';

/**
 * Data layer tornei — confine col backend.
 * Con `NEXT_PUBLIC_TOURNAMENTS_API_URL` usa il Tournament Service;
 * altrimenti fallback in-memory per sviluppo locale.
 */

function logMockMode(context: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.info(`[Tournaments] ${context} — mock in-memory (NEXT_PUBLIC_TOURNAMENTS_API_URL assente)`);
  }
}

export async function getTournaments(selection: Selection): Promise<Tournament[]> {
  if (!isTournamentsApiEnabled()) {
    return mockGetTournaments(selection);
  }
  try {
    return await fetchTournaments(selection);
  } catch (err) {
    console.error('[Tournaments] API lista fallita:', err);
    return mockGetTournaments(selection);
  }
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  if (!isTournamentsApiEnabled()) {
    return mockGetTournamentById(id);
  }
  try {
    return await fetchTournamentById(id);
  } catch (err) {
    console.error('[Tournaments] API getById fallita:', err);
    return mockGetTournamentById(id);
  }
}

export async function createTournament(
  input: CreateTournamentInput,
  creator: Participant,
): Promise<Tournament> {
  if (!isTournamentsApiEnabled()) {
    logMockMode('createTournament');
    return mockCreateTournament(input, creator);
  }
  return postCreateTournament(input);
}

export async function joinTournament(
  id: string,
  participant: Participant,
): Promise<JoinTournamentResult> {
  if (!isTournamentsApiEnabled()) {
    return mockJoinTournament(id, participant);
  }
  return postJoinTournament(id);
}

/** Aggiunge un torneo generato dal minigioco (solo mock). */
export async function addMockTournament(t: Tournament): Promise<void> {
  if (isTournamentsApiEnabled()) {
    console.warn('[Tournaments] addMockTournament ignorato: API reale attiva');
    return;
  }
  await mockAddTournament(t);
}

/** @deprecated Preferire joinTournament */
export async function joinMockTournament(id: string, username: string): Promise<void> {
  if (isTournamentsApiEnabled()) {
    await postJoinTournament(id);
    return;
  }
  await mockJoinTournamentLegacy(id, username);
}

export { TournamentApiError, isTournamentsApiEnabled };
