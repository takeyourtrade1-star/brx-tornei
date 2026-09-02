import { sleep } from 'k6';
import {
  COMPLETE_RESULTS,
  PROPOSAL_POLL_SECONDS,
  RESULT_CONFIRM_DELAY_SECONDS,
  RESULT_SETTLE_TIMEOUT_SECONDS,
} from '../config.js';
import { apiRequest, json, unwrap } from './api.js';
import { criticalFailures, resultCompleted } from './metrics.js';
import { resultTriggerReached } from './timing.js';

// Chiusura del risultato per consenso, nel cuore dello scenario live_http e
// solo via HTTP: non dipende dai WebSocket, che durante lo stop dei VU sono
// chiusi da k6 e non dal servizio. Player 1 invia il risultato, player 2
// conferma; entrambi verificano lo stato finale e l'esito e registrato una
// sola volta per match (lo stato e per VU: ogni giocatore ha il suo VU).

const SETTLE_RETRY_SECONDS = 1;
const HOST_VERIFY_INTERVAL_SECONDS = 2;
const HOST_VERIFY_MARGIN_SECONDS = 5;
// La conferma puo arrivare prima che la proposal sia visibile e una proposta
// gia presente torna rifiutata: questi codici sono tentativi transitori e non
// contano come fallimento. Il gate reale e la verifica finale dello stato.
const TOLERATED_RESULT_STATUSES = [200, 400, 404, 409, 422];
const PENDING_RESULT_STATUSES = new Set([
  'proposed',
  'pending',
  'pending_confirmation',
  'awaiting_confirmation',
]);

const states = new Map();

function resultState(matchId) {
  let state = states.get(matchId);
  if (!state) {
    state = { proposed: false, inFlight: false, completed: false };
    states.set(matchId, state);
  }
  return state;
}

function resultPath(player) {
  return `/api/v1/matches/${encodeURIComponent(player.matchId)}/result`;
}

function resultBody(player) {
  return {
    winner_user_id: player.resultWinnerId,
    winner_score: 2,
    loser_score: 1,
  };
}

function detailPayload(response) {
  const payload = unwrap(json(response));
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const tournament = payload.tournament && typeof payload.tournament === 'object'
    ? payload.tournament
    : payload;
  const match = payload.match && typeof payload.match === 'object'
    ? payload.match
    : tournament.match && typeof tournament.match === 'object'
      ? tournament.match
      : payload;
  return { payload, tournament, match };
}

function settledDetail(response, player) {
  const detail = detailPayload(response);
  if (!detail) return false;
  const { payload, tournament, match } = detail;
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

function tournamentRead(player, operation) {
  return apiRequest(
    player,
    'GET',
    `/api/v1/tournaments/${encodeURIComponent(player.tournamentId)}`,
    undefined,
    operation,
  );
}

function verifySettled(player) {
  const response = tournamentRead(player, 'result_verify');
  return response.status === 200 && settledDetail(response, player);
}

function pendingResultVisible(player) {
  const response = tournamentRead(player, 'result_poll');
  if (response.status !== 200) return false;
  const detail = detailPayload(response);
  if (!detail) return false;
  const { payload, tournament, match } = detail;
  const status = match.result_status || payload.result_status || tournament.result_status;
  return typeof status === 'string' && PENDING_RESULT_STATUSES.has(status.toLowerCase());
}

function submitResult(player, operation) {
  return apiRequest(
    player,
    'POST',
    resultPath(player),
    resultBody(player),
    operation,
    TOLERATED_RESULT_STATUSES,
    'mutation',
  );
}

// Player 1: invio del risultato. Un 409 indica una proposal gia presente
// (nessun duplicato). Se il match non e ancora pronto il tentativo si ripete
// alla prossima iterazione: qui restituiamo null senza registrare l'esito.
function claimAndAwaitSettled(player, state) {
  const claim = submitResult(player, 'result_claim');
  if (claim.status !== 200 && claim.status !== 409) return null;
  state.proposed = true;
  // La conferma arriva dall'avversario dopo il suo percorso completo (delay,
  // attesa proposal, finestra di settle): il budget host copre quel percorso
  // piu un margine, prima che inizi la discesa finale.
  const budgetSeconds = RESULT_CONFIRM_DELAY_SECONDS
    + PROPOSAL_POLL_SECONDS
    + RESULT_SETTLE_TIMEOUT_SECONDS
    + HOST_VERIFY_MARGIN_SECONDS;
  const deadline = Date.now() + budgetSeconds * 1_000;
  let settled = false;
  while (!settled && Date.now() <= deadline) {
    sleep(HOST_VERIFY_INTERVAL_SECONDS);
    settled = verifySettled(player);
  }
  return settled;
}

// Player 2: aspetta che la proposal sia visibile, conferma entro la finestra
// di settle e verifica lo stato finale. Ogni tentativo ricontrolla lo stato,
// cosi una conferma rifiutata per "gia presente" non genera duplicati.
function confirmAndVerifySettled(player) {
  sleep(RESULT_CONFIRM_DELAY_SECONDS);
  const pollDeadline = Date.now() + PROPOSAL_POLL_SECONDS * 1_000;
  while (Date.now() < pollDeadline && !pendingResultVisible(player)) {
    sleep(SETTLE_RETRY_SECONDS);
  }
  const deadline = Date.now() + RESULT_SETTLE_TIMEOUT_SECONDS * 1_000;
  let settled = false;
  while (!settled && Date.now() <= deadline) {
    submitResult(player, 'result_confirm');
    settled = verifySettled(player);
    if (!settled) sleep(SETTLE_RETRY_SECONDS);
  }
  return settled;
}

function recordOutcome(settled) {
  resultCompleted.add(settled);
  if (!settled) {
    criticalFailures.add(1, { operation: 'result_verify', reason: 'not_settled' });
  }
}

function completeResult(player, state) {
  if (player.pairPosition === 0) {
    const settled = claimAndAwaitSettled(player, state);
    if (settled === null) return false;
    recordOutcome(settled);
    return true;
  }
  recordOutcome(confirmAndVerifySettled(player));
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
