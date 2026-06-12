import 'server-only';

import { getActiveMatchPhase } from '@/lib/matches/timing';
import type {
  MatchDetail,
  MatchEvent,
  MatchGameResult,
  MatchPlayerSide,
  MatchScoreState,
} from '@/types/match';
import type { BestOf } from '@/types/tournament';
import { getMatchById as getBaseMatch } from '@/lib/data/matches';

/**
 * Data layer dettaglio partita — mock in-memory con stato mutabile per demo.
 */

const simulateLatency = () => new Promise((r) => setTimeout(r, 50));

function gamesToWin(bestOf: BestOf): number {
  if (bestOf === 'BO1') return 1;
  if (bestOf === 'BO3') return 2;
  return 3;
}

function parseScoreString(score?: string): { self: number; opponent: number } {
  if (!score) return { self: 0, opponent: 0 };
  const [self, opponent] = score.split('-').map((n) => Number.parseInt(n, 10));
  return {
    self: Number.isFinite(self) ? self : 0,
    opponent: Number.isFinite(opponent) ? opponent : 0,
  };
}

function buildInitialScoreState(bestOf: BestOf, score?: string): MatchScoreState {
  const parsed = parseScoreString(score);
  return {
    selfGames: parsed.self,
    opponentGames: parsed.opponent,
    currentGameSelfPoints: 0,
    currentGameOpponentPoints: 0,
    gamesHistory: [],
    isFinished: false,
  };
}

function seedEvents(matchId: string, opponent: string): MatchEvent[] {
  const base = new Date(Date.now() - 20 * 60_000).toISOString();
  return [
    {
      id: `${matchId}-ev-1`,
      type: 'partita_iniziata',
      timestamp: base,
      description: 'Partita avviata — buon match!',
    },
    {
      id: `${matchId}-ev-2`,
      type: 'game_vinto',
      timestamp: new Date(Date.now() - 12 * 60_000).toISOString(),
      description: 'Hai vinto il game 1',
      player: 'self',
    },
    {
      id: `${matchId}-ev-3`,
      type: 'punto_segnato',
      timestamp: new Date(Date.now() - 8 * 60_000).toISOString(),
      description: `Punto segnato per ${opponent}`,
      player: 'opponent',
    },
  ];
}

const MOCK_JUDGE_CALLS: MatchDetail['judgeCalls'] = [
  {
    id: 'jc-1',
    timestamp: new Date(Date.now() - 45 * 60_000).toISOString(),
    reason: 'Stack non chiaro — richiesta chiarimento',
    status: 'risolta',
    resolvedAt: new Date(Date.now() - 44 * 60_000).toISOString(),
  },
];

/** Stato mutabile per demo (azioni server). */
const liveState = new Map<string, MatchScoreState>();
const liveEvents = new Map<string, MatchEvent[]>();

function nextEventId(matchId: string): string {
  const count = (liveEvents.get(matchId)?.length ?? 0) + 1;
  return `${matchId}-ev-${count}`;
}

function getOrInitState(matchId: string, bestOf: BestOf, score?: string): MatchScoreState {
  const existing = liveState.get(matchId);
  if (existing) return existing;
  const initial = buildInitialScoreState(bestOf, score);
  liveState.set(matchId, initial);
  return initial;
}

function getOrInitEvents(matchId: string, opponent: string): MatchEvent[] {
  const existing = liveEvents.get(matchId);
  if (existing) return existing;
  const initial = seedEvents(matchId, opponent);
  liveEvents.set(matchId, initial);
  return initial;
}

/** Dettaglio partita per tavolo/gestione — null se non trovata o non dell'utente. */
export async function getMatchById(
  userId: string,
  matchId: string
): Promise<MatchDetail | null> {
  await simulateLatency();
  const base = await getBaseMatch(userId, matchId);
  if (!base) return null;

  const now = new Date();
  const withPhase =
    base.status === 'attiva' ? { ...base, activePhase: getActiveMatchPhase(base, now) } : base;

  const detail: MatchDetail = {
    ...withPhase,
    scoreState: getOrInitState(base.id, base.bestOf, base.score),
    events: getOrInitEvents(base.id, base.opponent),
    judgeCalls: base.id === 'm-1' ? MOCK_JUDGE_CALLS : [],
  };

  return detail;
}

function appendEvent(matchId: string, event: Omit<MatchEvent, 'id'>): MatchEvent[] {
  const events = liveEvents.get(matchId) ?? [];
  const next = { ...event, id: nextEventId(matchId) };
  const updated = [next, ...events];
  liveEvents.set(matchId, updated);
  return updated;
}

/** Segna un punto nel game corrente. */
export async function recordMatchPoint(
  userId: string,
  matchId: string,
  player: MatchPlayerSide
): Promise<{ detail: MatchDetail | null; error?: string }> {
  await simulateLatency();
  const detail = await getMatchById(userId, matchId);
  if (!detail) return { detail: null, error: 'Partita non trovata.' };
  if (detail.scoreState.isFinished) return { detail, error: 'La partita è già terminata.' };

  const state = { ...detail.scoreState };
  if (player === 'self') state.currentGameSelfPoints += 1;
  else state.currentGameOpponentPoints += 1;

  liveState.set(matchId, state);
  const label = player === 'self' ? 'Tu' : detail.opponent;
  appendEvent(matchId, {
    type: 'punto_segnato',
    timestamp: new Date().toISOString(),
    description: `Punto segnato per ${label}`,
    player,
  });

  return { detail: await getMatchById(userId, matchId) };
}

/** Segna vittoria del game corrente e avanza il conteggio BO. */
export async function recordGameWin(
  userId: string,
  matchId: string,
  winner: MatchPlayerSide
): Promise<{ detail: MatchDetail | null; error?: string }> {
  await simulateLatency();
  const detail = await getMatchById(userId, matchId);
  if (!detail) return { detail: null, error: 'Partita non trovata.' };
  if (detail.scoreState.isFinished) return { detail, error: 'La partita è già terminata.' };

  const state = { ...detail.scoreState };
  const gameNumber = state.gamesHistory.length + 1;
  const gameResult: MatchGameResult = {
    gameNumber,
    winner,
    selfPoints: state.currentGameSelfPoints,
    opponentPoints: state.currentGameOpponentPoints,
  };

  state.gamesHistory = [...state.gamesHistory, gameResult];
  state.currentGameSelfPoints = 0;
  state.currentGameOpponentPoints = 0;

  if (winner === 'self') state.selfGames += 1;
  else state.opponentGames += 1;

  const needed = gamesToWin(detail.bestOf);
  if (state.selfGames >= needed || state.opponentGames >= needed) {
    state.isFinished = true;
    state.winner = state.selfGames >= needed ? 'self' : 'opponent';
  }

  liveState.set(matchId, state);

  const winnerLabel = winner === 'self' ? 'Tu' : detail.opponent;
  appendEvent(matchId, {
    type: 'game_vinto',
    timestamp: new Date().toISOString(),
    description: `${winnerLabel} ha vinto il game ${gameNumber}`,
    player: winner,
  });

  if (state.isFinished) {
    appendEvent(matchId, {
      type: 'partita_finita',
      timestamp: new Date().toISOString(),
      description: `Partita conclusa — vincitore: ${state.winner === 'self' ? 'Tu' : detail.opponent}`,
      player: state.winner,
    });
  }

  return { detail: await getMatchById(userId, matchId) };
}

/** Segna la partita come finita manualmente. */
export async function finishMatch(
  userId: string,
  matchId: string,
  winner: MatchPlayerSide
): Promise<{ detail: MatchDetail | null; error?: string }> {
  await simulateLatency();
  const detail = await getMatchById(userId, matchId);
  if (!detail) return { detail: null, error: 'Partita non trovata.' };
  if (detail.scoreState.isFinished) return { detail, error: 'La partita è già terminata.' };

  const state: MatchScoreState = {
    ...detail.scoreState,
    isFinished: true,
    winner,
  };

  if (winner === 'self' && state.selfGames <= state.opponentGames) {
    state.selfGames = Math.max(state.selfGames, state.opponentGames + 1);
  }
  if (winner === 'opponent' && state.opponentGames <= state.selfGames) {
    state.opponentGames = Math.max(state.opponentGames, state.selfGames + 1);
  }

  liveState.set(matchId, state);
  appendEvent(matchId, {
    type: 'partita_finita',
    timestamp: new Date().toISOString(),
    description: `Partita chiusa manualmente — vincitore: ${winner === 'self' ? 'Tu' : detail.opponent}`,
    player: winner,
  });

  return { detail: await getMatchById(userId, matchId) };
}
