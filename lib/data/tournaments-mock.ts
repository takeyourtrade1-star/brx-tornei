import 'server-only';

import type { Participant, Tournament, JoinTournamentResult } from '@/types/tournament';
import type { Selection } from '@/lib/validations/selection';
import type { CreateTournamentInput } from '@/lib/validations/tournament';
import { extendMockTournaments } from './mock-tournament-seed';

const MOCK_STORE_KEY = '__brx_tournaments_mock_store__';

/** Seed iniziale (solo al primo avvio del processo). */
const INITIAL_SEED: Tournament[] = [
  {
    id: 't-os-1',
    format: 'old-school',
    mode: 'heads-up',
    buyIn: 'for_fun',
    bestOf: 'BO5',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [{ id: 'u-10', username: 'brx_player' }],
    createdAt: '2026-06-10T09:00:00Z',
    isPrivate: true,
  },
  {
    id: 't-mo-2',
    format: 'modern',
    mode: 'heads-up',
    buyIn: 'low',
    bestOf: 'BO3',
    status: 'iniziata',
    maxPlayers: 2,
    participants: [
      { id: 'u-1', username: 'marco..199' },
      { id: 'u-2', username: 'franco2005' },
    ],
    createdAt: '2026-06-09T18:30:00Z',
    matchId: 'mock-match-mo-2',
    matchWebcamSessionId: 'mock-session-mo-2',
  },
];

type GlobalMock = typeof globalThis & {
  [MOCK_STORE_KEY]?: Tournament[];
};

/** Store in-memory condiviso nel processo Node (sopravvive all'HMR del dev server). */
function getStore(): Tournament[] {
  const g = globalThis as GlobalMock;
  if (!g[MOCK_STORE_KEY]) {
    g[MOCK_STORE_KEY] = extendMockTournaments(INITIAL_SEED);
  }
  return g[MOCK_STORE_KEY];
}

function setStore(next: Tournament[]): void {
  (globalThis as GlobalMock)[MOCK_STORE_KEY] = next;
}

const simulateLatency = () => new Promise((r) => setTimeout(r, 50));

function newSessionId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function mockGetTournaments(selection: Selection): Promise<Tournament[]> {
  await simulateLatency();
  const store = getStore();
  return store
    .filter((t) => t.format === selection.format && t.mode === selection.mode)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function mockGetTournamentById(id: string): Promise<Tournament | null> {
  await simulateLatency();
  return getStore().find((t) => t.id === id) ?? null;
}

export async function mockCreateTournament(
  input: CreateTournamentInput,
  creator: Participant,
): Promise<Tournament> {
  await simulateLatency();
  const tournament: Tournament = {
    id: `t-${Date.now()}`,
    format: input.format,
    mode: input.mode,
    buyIn: 'for_fun',
    bestOf: input.bestOf,
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [creator],
    createdAt: new Date().toISOString(),
    isPrivate: input.isPrivate ?? false,
    isTournament: input.isTournament ?? false,
    enableScryfallCheck: input.isTournament
      ? true
      : Boolean(input.enableScryfallCheck),
    enablePhysicalVerification: input.isTournament
      ? true
      : Boolean(input.enablePhysicalVerification),
    webcamSessionId: newSessionId(),
    createdById: creator.id,
  };
  setStore([tournament, ...getStore()]);
  return tournament;
}

export async function mockJoinTournament(
  id: string,
  participant: Participant,
): Promise<JoinTournamentResult> {
  await simulateLatency();
  let result: JoinTournamentResult | null = null;

  const next = getStore().map((t) => {
    if (t.id !== id) return t;
    if (t.participants.some((p) => p.id === participant.id || p.username === participant.username)) {
      result = { tournament: t, matchId: t.matchId, matchWebcamSessionId: t.matchWebcamSessionId };
      return t;
    }
    const participants = [...t.participants, participant];
    const full = participants.length >= t.maxPlayers;
    const updated: Tournament = {
      ...t,
      participants,
      status: full ? 'iniziata' : t.status,
      matchId: full ? `match-${t.id}` : t.matchId,
      matchWebcamSessionId: full ? newSessionId() : t.matchWebcamSessionId,
    };
    result = {
      tournament: updated,
      matchId: updated.matchId,
      matchWebcamSessionId: updated.matchWebcamSessionId,
    };
    return updated;
  });

  setStore(next);

  if (!result) {
    throw new Error('Torneo non trovato');
  }
  return result;
}

export async function mockAddTournament(t: Tournament): Promise<void> {
  await simulateLatency();
  setStore([t, ...getStore()]);
}

/** @deprecated Usare mockJoinTournament */
export async function mockJoinTournamentLegacy(id: string, username: string): Promise<void> {
  await mockJoinTournament(id, { id: `u-${Date.now()}`, username });
}
