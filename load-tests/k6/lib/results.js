import exec from 'k6/execution';
import { sleep } from 'k6';
import {
  BACKEND_URL,
  COMPLETE_RESULTS,
  RESULT_CONFIRM_DELAY_SECONDS,
  RESULT_SETTLE_TIMEOUT_SECONDS,
  RESULT_TRIGGER_PROGRESS,
  RESULT_TRIGGER_SECONDS,
  SCENARIO_DURATION_SECONDS,
} from '../config.js';
import { apiRequest, json, unwrap } from './api.js';
import { criticalFailures, resultCompleted } from './metrics.js';

const states = new Map();

function progressFraction() {
  const progress = Number(exec.scenario.progress);
  if (!Number.isFinite(progress)) return null;
  return progress > 1 ? progress / 100 : progress;
}

function elapsedSeconds() {
  const rawStart = exec.scenario.startTime;
  const startMs = rawStart instanceof Date
    ? rawStart.getTime()
    : typeof rawStart === 'number'
      ? rawStart
      : Date.parse(String(rawStart || ''));
  return Number.isFinite(startMs) ? (Date.now() - startMs) / 1_000 : null;
}

export function resultTriggerReached() {
  const progress = progressFraction();
  if (progress !== null) return progress >= RESULT_TRIGGER_PROGRESS;
  const elapsed = elapsedSeconds();
  return elapsed !== null
    ? elapsed >= RESULT_TRIGGER_SECONDS
    : SCENARIO_DURATION_SECONDS <= RESULT_TRIGGER_SECONDS;
}

function resultState(matchId) {
  let state = states.get(matchId);
  if (!state) {
    state = { proposed: false, inFlight: false, completed: false };
    states.set(matchId, state);
  }
  return state;
}

function resultBody(player) {
  return {
    winner_user_id: player.resultWinnerId,
    winner_score: 2,
    loser_score: 1,
  };
}

function settledDetail(response, player) {
  const payload = unwrap(json(response));
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const tournament = payload.tournament && typeof payload.tournament === 'object'
    ? payload.tournament
    : payload;
  const match = payload.match && typeof payload.match === 'object'
    ? payload.match
    : tournament.match && typeof tournament.match === 'object'
      ? tournament.match
      : payload;
  const resultStatus = match.result_status || payload.result_status;
  const matchStatus = match.match_status || match.status || payload.match_status;
  const tournamentStatus = tournament.status || payload.tournament_status;
  const winnerId = match.winner_user_id || payload.winner_user_id;
  return resultStatus === 'settled'
    && ['finished', 'completed'].includes(matchStatus)
    && ['terminata', 'completed', 'finished'].includes(tournamentStatus)
    && typeof winnerId === 'string'
    && winnerId.toLowerCase() === String(player.resultWinnerId).toLowerCase();
}

function verifySettled(player) {
  const response = apiRequest(
    player,
    'GET',
    `/api/v1/tournaments/${encodeURIComponent(player.tournamentId)}`,
    undefined,
    'result_verify',
  );
  return response.status === 200 && settledDetail(response, player);
}

function completeResult(player, state) {
  const body = resultBody(player);
  if (player.pairPosition === 0) {
    const proposal = apiRequest(
      player,
      'POST',
      `/api/v1/matches/${encodeURIComponent(player.matchId)}/result`,
      body,
      'result_claim',
      [200],
      'mutation',
    );
    state.proposed = proposal.status === 200;
    return state.proposed;
  }

  sleep(RESULT_CONFIRM_DELAY_SECONDS);
  const deadline = Date.now() + RESULT_SETTLE_TIMEOUT_SECONDS * 1_000;
  let settled = false;
  while (!settled && Date.now() <= deadline) {
    const confirmation = apiRequest(
      player,
      'POST',
      `/api/v1/matches/${encodeURIComponent(player.matchId)}/result`,
      body,
      'result_confirm',
      [200],
      'mutation',
    );
    if (confirmation.status === 200) settled = verifySettled(player);
    if (!settled) sleep(1);
  }
  if (!settled) {
    criticalFailures.add(1, { operation: 'result_verify', reason: 'not_settled' });
  }
  resultCompleted.add(settled);
  state.completed = true;
  return true;
}

export function maybeCompleteResult(player) {
  if (
    !COMPLETE_RESULTS ||
    !resultTriggerReached() ||
    !player ||
    typeof player.matchId !== 'string'
  ) {
    return false;
  }
  const state = resultState(player.matchId);
  if (state.completed || state.inFlight || (player.pairPosition === 0 && state.proposed)) {
    return state.completed || state.proposed;
  }
  state.inFlight = true;
  try {
    return completeResult(player, state);
  } finally {
    state.inFlight = false;
  }
}
