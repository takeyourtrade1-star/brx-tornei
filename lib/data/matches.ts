import 'server-only';

import {
  computeEndsAt,
  DEMO_MATCH_DURATION_MINUTES,
  getActiveMatchPhase,
} from '@/lib/matches/timing';
import type { ActiveMatchesGrouped, Match, MatchStatus } from '@/types/match';
import type { MatchTab } from '@/lib/validations/match-filters';

/**
 * Data layer partite — confine col backend.
 * MVP: mock in-memory filtrato per utente e tab.
 */

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function buildMatch(
  partial: Omit<Match, 'endsAt'> & { startsAt: string }
): Match {
  const endsAt = computeEndsAt(
    new Date(partial.startsAt),
    DEMO_MATCH_DURATION_MINUTES
  ).toISOString();
  return { ...partial, endsAt };
}

const MOCK_MATCHES: Match[] = [
  buildMatch({
    id: 'm-1',
    userId: 'u-1',
    tournamentId: 't-mo-2',
    tournamentLabel: 'Modern · Heads-Up BO3',
    format: 'modern',
    opponent: 'franco2005',
    deckName: 'Izzet Murktide',
    status: 'attiva',
    score: '1-0',
    bestOf: 'BO3',
    startsAt: minutesFromNow(-20),
  }),
  buildMatch({
    id: 'm-2',
    userId: 'u-1',
    tournamentId: 't-pi-1',
    tournamentLabel: 'Pioneer · Heads-Up BO3',
    format: 'pioneer',
    opponent: 'chiara_mtg',
    deckName: 'Rakdos Midrange',
    status: 'attiva',
    score: '0-0',
    bestOf: 'BO3',
    startsAt: minutesFromNow(90),
  }),
  buildMatch({
    id: 'm-3',
    userId: 'u-1',
    tournamentId: 't-os-2',
    tournamentLabel: 'Old School · Heads-Up BO3',
    format: 'old-school',
    opponent: 'franco2005',
    deckName: 'The Deck',
    status: 'completata',
    result: 'vittoria',
    score: '2-1',
    bestOf: 'BO3',
    startsAt: minutesFromNow(-3 * 24 * 60),
  }),
  buildMatch({
    id: 'm-4',
    userId: 'u-1',
    tournamentId: 't-mo-3',
    tournamentLabel: 'Modern · Heads-Up BO5',
    format: 'modern',
    opponent: 'marco_mengoni',
    deckName: 'Mono Black Coffers',
    status: 'completata',
    result: 'sconfitta',
    score: '1-3',
    bestOf: 'BO5',
    startsAt: minutesFromNow(-4 * 24 * 60),
  }),
  buildMatch({
    id: 'm-5',
    userId: 'u-1',
    tournamentId: 't-lg-2',
    tournamentLabel: 'Legacy · Heads-Up BO3',
    format: 'legacy',
    opponent: 'ale_reborn',
    deckName: 'Delver of Secrets',
    status: 'completata',
    result: 'vittoria',
    score: '2-0',
    bestOf: 'BO3',
    startsAt: minutesFromNow(-5 * 24 * 60),
  }),
  buildMatch({
    id: 'm-6',
    userId: 'u-1',
    tournamentId: 't-os-1',
    tournamentLabel: 'Old School · Heads-Up BO5',
    format: 'old-school',
    opponent: 'brx_player',
    deckName: 'The Deck',
    status: 'in_attesa',
    bestOf: 'BO5',
    startsAt: minutesFromNow(180),
  }),
  buildMatch({
    id: 'm-7',
    userId: 'u-1',
    tournamentId: 't-st-1',
    tournamentLabel: 'Standard · Heads-Up BO3',
    format: 'standard',
    opponent: 'simone_deck',
    deckName: 'Esper Midrange',
    status: 'in_attesa',
    bestOf: 'BO3',
    startsAt: minutesFromNow(240),
  }),
];

const TAB_TO_STATUS: Record<MatchTab, MatchStatus> = {
  attive: 'attiva',
  completate: 'completata',
  in_attesa: 'in_attesa',
};

const simulateLatency = () => new Promise((r) => setTimeout(r, 50));

/** Profilo mock con partite precaricate (MVP senza API utenti). */
const DEMO_USER_ID = 'u-1';

function filterUserMatches(userId: string): Match[] {
  const own = MOCK_MATCHES.filter((m) => m.userId === userId);
  if (own.length > 0) return own;
  return MOCK_MATCHES.filter((m) => m.userId === DEMO_USER_ID);
}

function withActivePhase(match: Match, now: Date): Match {
  if (match.status !== 'attiva') return match;
  return { ...match, activePhase: getActiveMatchPhase(match, now) };
}

function sortByStartsAtDesc(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

/** Partite attive suddivise in In corso e Programmate (classificazione server-side). */
export async function getActiveMatchesGrouped(userId: string): Promise<ActiveMatchesGrouped> {
  await simulateLatency();
  const now = new Date();
  const active = filterUserMatches(userId)
    .filter((m) => m.status === 'attiva')
    .map((m) => withActivePhase(m, now));

  return {
    inCorso: sortByStartsAtDesc(active.filter((m) => m.activePhase === 'in_corso')),
    programmate: sortByStartsAtDesc(active.filter((m) => m.activePhase === 'programmata')),
  };
}

/** Partite dell'utente filtrate per tab, più recenti prima. */
export async function getMatches(userId: string, tab: MatchTab): Promise<Match[]> {
  await simulateLatency();
  const status = TAB_TO_STATUS[tab];
  const now = new Date();
  return sortByStartsAtDesc(
    filterUserMatches(userId)
      .filter((m) => m.status === status)
      .map((m) => withActivePhase(m, now))
  );
}

/** Conteggi per tab (badge sui filtri). */
export async function getMatchCounts(userId: string): Promise<Record<MatchTab, number>> {
  await simulateLatency();
  const userMatches = filterUserMatches(userId);
  return {
    attive: userMatches.filter((m) => m.status === 'attiva').length,
    completate: userMatches.filter((m) => m.status === 'completata').length,
    in_attesa: userMatches.filter((m) => m.status === 'in_attesa').length,
  };
}

/** Partite che bloccano nuove iscrizioni (attive o in attesa). */
export async function getUserBlockingMatches(userId: string): Promise<Match[]> {
  await simulateLatency();
  const blockingStatuses: MatchStatus[] = ['attiva', 'in_attesa'];
  return filterUserMatches(userId).filter((m) => blockingStatuses.includes(m.status));
}

/** Singola partita per id (qualsiasi stato), con fase attiva se applicabile. */
export async function getMatchById(userId: string, matchId: string): Promise<Match | null> {
  await simulateLatency();
  const now = new Date();
  const match = filterUserMatches(userId).find((m) => m.id === matchId);
  if (!match) return null;
  return withActivePhase(match, now);
}
