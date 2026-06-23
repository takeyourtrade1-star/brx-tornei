import 'server-only';

import type { Participant, Tournament } from '@/types/tournament';
import type { Selection } from '@/lib/validations/selection';
import type { CreateTournamentInput } from '@/lib/validations/tournament';

import { extendMockTournaments } from './mock-tournament-seed';

/**
 * Data layer tornei — confine col backend.
 * MVP: store in-memory con i dati del mockup. Quando l'API tornei sarà pronta,
 * solo questo file cambia (fetch autenticato col token dal cookie); le pagine no.
 */

let mockTournaments: Tournament[] = extendMockTournaments([
  // ── Old School ──
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
    id: 't-os-4',
    format: 'old-school',
    mode: 'heads-up',
    buyIn: 'micro',
    bestOf: 'BO3',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [],
    createdAt: '2026-06-10T08:30:00Z',
  },
  {
    id: 't-os-2',
    format: 'old-school',
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
  },
  {
    id: 't-os-3',
    format: 'old-school',
    mode: 'heads-up',
    buyIn: 'mid',
    bestOf: 'BO5',
    status: 'terminata',
    maxPlayers: 2,
    participants: [
      { id: 'u-3', username: 'giuseppe_pro' },
      { id: 'u-4', username: 'marco_mengoni' },
    ],
    createdAt: '2026-06-08T15:00:00Z',
  },

  // ── Pre Modern ──
  {
    id: 't-pm-1',
    format: 'premodern',
    mode: 'heads-up',
    buyIn: 'for_fun',
    bestOf: 'BO3',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [{ id: 'u-5', username: 'luca_vintage' }],
    createdAt: '2026-06-10T12:00:00Z',
  },
  {
    id: 't-pm-2',
    format: 'premodern',
    mode: 'heads-up',
    buyIn: 'micro',
    bestOf: 'BO5',
    status: 'terminata',
    maxPlayers: 2,
    participants: [
      { id: 'u-6', username: 'ale_reborn' },
      { id: 'u-7', username: 'davide_tcg' },
    ],
    createdAt: '2026-06-07T20:00:00Z',
  },

  // ── Pioneer ──
  {
    id: 't-pi-1',
    format: 'pioneer',
    mode: 'heads-up',
    buyIn: 'low',
    bestOf: 'BO3',
    status: 'iniziata',
    maxPlayers: 2,
    participants: [
      { id: 'u-8', username: 'franco2005' },
      { id: 'u-9', username: 'chiara_mtg' },
    ],
    createdAt: '2026-06-10T14:00:00Z',
  },
  {
    id: 't-pi-2',
    format: 'pioneer',
    mode: 'heads-up',
    buyIn: 'mid',
    bestOf: 'BO5',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [],
    createdAt: '2026-06-10T16:00:00Z',
  },

  // ── Modern ──
  {
    id: 't-mo-1',
    format: 'modern',
    mode: 'heads-up',
    buyIn: 'for_fun',
    bestOf: 'BO5',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [],
    createdAt: '2026-06-10T09:00:00Z',
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
  },
  {
    id: 't-mo-3',
    format: 'modern',
    mode: 'heads-up',
    buyIn: 'high',
    bestOf: 'BO5',
    status: 'terminata',
    maxPlayers: 2,
    participants: [
      { id: 'u-3', username: 'giuseppe_pro' },
      { id: 'u-4', username: 'marco_mengoni' },
    ],
    createdAt: '2026-06-08T15:00:00Z',
  },

  // ── Standard ──
  {
    id: 't-st-1',
    format: 'standard',
    mode: 'heads-up',
    buyIn: 'micro',
    bestOf: 'BO3',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [{ id: 'u-10', username: 'simone_deck' }],
    createdAt: '2026-06-10T10:30:00Z',
  },
  {
    id: 't-st-2',
    format: 'standard',
    mode: 'heads-up',
    buyIn: 'mid',
    bestOf: 'BO5',
    status: 'iniziata',
    maxPlayers: 2,
    participants: [
      { id: 'u-11', username: 'elena_play' },
      { id: 'u-12', username: 'matteo_gg' },
    ],
    createdAt: '2026-06-09T21:00:00Z',
  },

  // ── Legacy ──
  {
    id: 't-lg-1',
    format: 'legacy',
    mode: 'heads-up',
    buyIn: 'for_fun',
    bestOf: 'BO5',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [],
    createdAt: '2026-06-10T08:00:00Z',
  },
  {
    id: 't-lg-2',
    format: 'legacy',
    mode: 'heads-up',
    buyIn: 'low',
    bestOf: 'BO3',
    status: 'terminata',
    maxPlayers: 2,
    participants: [
      { id: 'u-13', username: 'marco..199' },
      { id: 'u-14', username: 'ale_reborn' },
    ],
    createdAt: '2026-06-07T11:00:00Z',
  },

  // ── Pauper ──
  {
    id: 't-pau-1',
    format: 'pauper',
    mode: 'heads-up',
    buyIn: 'for_fun',
    bestOf: 'BO3',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [],
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 't-pau-2',
    format: 'pauper',
    mode: 'heads-up',
    buyIn: 'micro',
    bestOf: 'BO5',
    status: 'iniziata',
    maxPlayers: 2,
    participants: [
      { id: 'u-17', username: 'faerie_king' },
      { id: 'u-18', username: 'common_hero' },
    ],
    createdAt: '2026-06-09T14:00:00Z',
  },

  // ── Commander ──
  {
    id: 't-cmd-1',
    format: 'commander',
    mode: 'heads-up',
    buyIn: 'mid',
    bestOf: 'BO3',
    status: 'iniziata',
    maxPlayers: 2,
    participants: [
      { id: 'u-15', username: 'giuseppe_pro' },
      { id: 'u-16', username: 'chiara_mtg' },
    ],
    createdAt: '2026-06-10T17:00:00Z',
  },
  {
    id: 't-cmd-2',
    format: 'commander',
    mode: 'heads-up',
    buyIn: 'high',
    bestOf: 'BO5',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [{ id: 'u-4', username: 'marco_mengoni' }],
    createdAt: '2026-06-10T19:00:00Z',
  },
]);

const simulateLatency = () => new Promise((r) => setTimeout(r, 50));

/** Tornei filtrati per formato+modalità selezionati, più recenti prima. */
export async function getTournaments(selection: Selection): Promise<Tournament[]> {
  await simulateLatency();
  return mockTournaments
    .filter((t) => t.format === selection.format && t.mode === selection.mode)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
    maxPlayers: 2,
    participants: [creator],
    createdAt: new Date().toISOString(),
  };
  mockTournaments = [tournament, ...mockTournaments];
  return tournament;
}

/** Aggiunge un torneo creato nel minigioco */
export async function addMockTournament(t: Tournament): Promise<void> {
  await simulateLatency();
  mockTournaments = [t, ...mockTournaments];
}

/** Partecipa a un torneo esistente dal minigioco */
export async function joinMockTournament(id: string, username: string): Promise<void> {
  await simulateLatency();
  mockTournaments = mockTournaments.map((t) => {
    if (t.id !== id) return t;
    if (t.participants.some((p) => p.username === username)) return t;
    const newParticipant: Participant = { id: `u-${Date.now()}`, username };
    const participants = [...t.participants, newParticipant];
    const status = participants.length >= t.maxPlayers ? 'iniziata' : t.status;
    return { ...t, participants, status };
  });
}
