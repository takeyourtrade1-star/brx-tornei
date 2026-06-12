import 'server-only';

import type { Participant, Tournament } from '@/types/tournament';
import type { Selection } from '@/lib/validations/selection';
import type { CreateTournamentInput } from '@/lib/validations/tournament';

/**
 * Data layer tornei — confine col backend.
 * MVP: store in-memory con i dati del mockup. Quando l'API tornei sarà pronta,
 * solo questo file cambia (fetch autenticato col token dal cookie); le pagine no.
 */

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

type TournamentSeed = Omit<Tournament, 'startsAt' | 'createdAt'> & {
  startsInMinutes: number;
  createdInMinutes?: number;
};

function seedTournament(seed: TournamentSeed): Tournament {
  return {
    ...seed,
    startsAt: minutesFromNow(seed.startsInMinutes),
    createdAt: minutesFromNow(seed.createdInMinutes ?? seed.startsInMinutes - 120),
  };
}

let mockTournaments: Tournament[] = [
  seedTournament({
    id: 't-os-1', format: 'old-school', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO5',
    status: 'in_registrazione', maxPlayers: 2,
    participants: [{ id: 'u-10', username: 'brx_player' }], startsInMinutes: 180, isPrivate: true,
  }),
  seedTournament({
    id: 't-os-4', format: 'old-school', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO3',
    status: 'in_registrazione', maxPlayers: 2, participants: [], startsInMinutes: 300,
  }),
  seedTournament({
    id: 't-os-2', format: 'old-school', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO3',
    status: 'iniziata', maxPlayers: 2,
    participants: [{ id: 'u-1', username: 'marco..199' }, { id: 'u-2', username: 'franco2005' }],
    startsInMinutes: -25,
  }),
  seedTournament({
    id: 't-os-3', format: 'old-school', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO5',
    status: 'terminata', maxPlayers: 2,
    participants: [{ id: 'u-3', username: 'giuseppe_pro' }, { id: 'u-4', username: 'marco_mengoni' }],
    startsInMinutes: -4 * 24 * 60,
  }),
  seedTournament({
    id: 't-pm-1', format: 'premodern', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO3',
    status: 'in_registrazione', maxPlayers: 2,
    participants: [{ id: 'u-5', username: 'luca_vintage' }], startsInMinutes: 30,
  }),
  seedTournament({
    id: 't-pm-2', format: 'premodern', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO5',
    status: 'terminata', maxPlayers: 2,
    participants: [{ id: 'u-6', username: 'ale_reborn' }, { id: 'u-7', username: 'davide_tcg' }],
    startsInMinutes: -5 * 24 * 60,
  }),
  seedTournament({
    id: 't-pi-1', format: 'pioneer', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO3',
    status: 'iniziata', maxPlayers: 2,
    participants: [{ id: 'u-8', username: 'franco2005' }, { id: 'u-9', username: 'chiara_mtg' }],
    startsInMinutes: -10,
  }),
  seedTournament({
    id: 't-pi-2', format: 'pioneer', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO5',
    status: 'in_registrazione', maxPlayers: 2, participants: [], startsInMinutes: 100,
  }),
  seedTournament({
    id: 't-mo-1', format: 'modern', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO5',
    status: 'in_registrazione', maxPlayers: 2, participants: [], startsInMinutes: 360,
  }),
  seedTournament({
    id: 't-mo-2', format: 'modern', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO3',
    status: 'iniziata', maxPlayers: 2,
    participants: [{ id: 'u-1', username: 'marco..199' }, { id: 'u-2', username: 'franco2005' }],
    startsInMinutes: -20,
  }),
  seedTournament({
    id: 't-mo-3', format: 'modern', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO5',
    status: 'terminata', maxPlayers: 2,
    participants: [{ id: 'u-3', username: 'giuseppe_pro' }, { id: 'u-4', username: 'marco_mengoni' }],
    startsInMinutes: -4 * 24 * 60,
  }),
  seedTournament({
    id: 't-st-1', format: 'standard', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO3',
    status: 'in_registrazione', maxPlayers: 2,
    participants: [{ id: 'u-10', username: 'simone_deck' }], startsInMinutes: 240,
  }),
  seedTournament({
    id: 't-st-2', format: 'standard', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO5',
    status: 'iniziata', maxPlayers: 2,
    participants: [{ id: 'u-11', username: 'elena_play' }, { id: 'u-12', username: 'matteo_gg' }],
    startsInMinutes: -15,
  }),
  seedTournament({
    id: 't-lg-1', format: 'legacy', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO5',
    status: 'in_registrazione', maxPlayers: 2, participants: [], startsInMinutes: 400,
  }),
  seedTournament({
    id: 't-lg-2', format: 'legacy', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO3',
    status: 'terminata', maxPlayers: 2,
    participants: [{ id: 'u-13', username: 'marco..199' }, { id: 'u-14', username: 'ale_reborn' }],
    startsInMinutes: -5 * 24 * 60,
  }),
  seedTournament({
    id: 't-cmd-1', format: 'commander', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO3',
    status: 'iniziata', maxPlayers: 2,
    participants: [{ id: 'u-15', username: 'giuseppe_pro' }, { id: 'u-16', username: 'chiara_mtg' }],
    startsInMinutes: -5,
  }),
  seedTournament({
    id: 't-cmd-2', format: 'commander', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO5',
    status: 'in_registrazione', maxPlayers: 2,
    participants: [{ id: 'u-4', username: 'marco_mengoni' }], startsInMinutes: 120,
  }),
];

const simulateLatency = () => new Promise((r) => setTimeout(r, 50));

const ENROLLMENT_BLOCKING_STATUSES = new Set<Tournament['status']>([
  'in_registrazione',
  'iniziata',
]);

/** Tornei filtrati per formato+modalità selezionati, più recenti prima. */
export async function getTournaments(selection: Selection): Promise<Tournament[]> {
  await simulateLatency();
  return mockTournaments
    .filter((t) => t.format === selection.format && t.mode === selection.mode)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  await simulateLatency();
  return mockTournaments.find((t) => t.id === id) ?? null;
}

const DEMO_USER_ID = 'u-1';

/** Tornei a cui l'utente è iscritto e che occupano uno slot temporale. */
export async function getUserEnrolledTournaments(userId: string): Promise<Tournament[]> {
  await simulateLatency();
  const profileIds = new Set([userId, DEMO_USER_ID]);
  return mockTournaments.filter(
    (t) =>
      ENROLLMENT_BLOCKING_STATUSES.has(t.status) &&
      t.participants.some((p) => profileIds.has(p.id))
  );
}

/** Aggiunge un partecipante al torneo (mock). */
export async function enrollParticipant(
  tournamentId: string,
  participant: Participant
): Promise<boolean> {
  await simulateLatency();
  const index = mockTournaments.findIndex((t) => t.id === tournamentId);
  if (index === -1) return false;

  const tournament = mockTournaments[index]!;
  if (tournament.participants.some((p) => p.id === participant.id)) return false;
  if (tournament.participants.length >= tournament.maxPlayers) return false;

  mockTournaments[index] = {
    ...tournament,
    participants: [...tournament.participants, participant],
  };
  return true;
}

/** Crea un torneo (mock). Chiamato SOLO dalla server action, mai dal client. */
export async function createTournament(
  input: CreateTournamentInput,
  creator: Participant
): Promise<Tournament> {
  await simulateLatency();
  const tournament: Tournament = {
    id: `t-${Date.now()}`,
    format: input.format,
    mode: input.mode,
    buyIn: 'for_fun',
    bestOf: input.bestOf,
    status: 'in_registrazione',
    maxPlayers: input.maxPlayers,
    participants: [creator],
    createdAt: new Date().toISOString(),
    startsAt: minutesFromNow(120),
    isPrivate: input.visibility === 'private',
  };
  mockTournaments = [tournament, ...mockTournaments];
  return tournament;
}
