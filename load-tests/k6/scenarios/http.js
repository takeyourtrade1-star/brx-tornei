import http from 'k6/http';
import exec from 'k6/execution';
import { check, sleep } from 'k6';
import {
  BACKEND_URL,
  FRONTEND_URL,
  INCLUDE_BACKEND_READS,
  INCLUDE_FRONTEND,
  INCLUDE_FRONTEND_SIGNALING,
  INCLUDE_QUALITY,
} from '../config.js';
import {
  apiRequest,
  frontendRequest,
  json,
  refreshIdentity,
  setFrontendSession,
  unwrap,
} from '../lib/api.js';
import { criticalFailures, rateLimited, readDuration, serverErrors } from '../lib/metrics.js';
import { maybeCompleteResult } from '../lib/results.js';

let current;
let lastQualityAt = 0;

function playerFor(data, refresh = true) {
  const index = (exec.vu.idInTest - 1) % data.players.length;
  if (!current || current.userId !== data.players[index].userId) {
    current = { ...data.players[index] };
  }
  if (refresh) current = refreshIdentity(current, 90);
  return current;
}

function frontendRead(player) {
  setFrontendSession(player);
  const response = http.get(
    `${FRONTEND_URL}/tornei/${encodeURIComponent(player.tournamentId)}/live`,
    {
    redirects: 0,
    tags: { operation: 'frontend_live', kind: 'frontend' },
    responseCallback: http.expectedStatuses(200),
    timeout: '30s',
    },
  );
  readDuration.add(response.timings.duration, { operation: 'frontend_live', kind: 'frontend' });
  const ok = response.status === 200;
  if (response.status === 429) rateLimited.add(1, { operation: 'frontend_live' });
  if (response.status >= 500) serverErrors.add(1, { operation: 'frontend_live' });
  if (!ok) criticalFailures.add(1, { operation: 'frontend_live', status: String(response.status) });
  check(response, { 'frontend live HTTP 200': () => ok });
}

function backendReads(player) {
  const tournamentId = encodeURIComponent(player.tournamentId);
  apiRequest(player, 'GET', '/api/v1/players/me/profile', undefined, 'live_profile');
  apiRequest(
    player,
    'GET',
    `/api/v1/tournaments/${tournamentId}`,
    undefined,
    'live_tournament',
  );
  apiRequest(player, 'GET', '/api/v1/players/me/reputation', undefined, 'live_reputation');
}

function quality(player) {
  const now = Date.now();
  if (!INCLUDE_QUALITY || now - lastQualityAt < 15_000) return;
  lastQualityAt = now;
  apiRequest(
    player,
    'POST',
    `/api/v1/matches/${encodeURIComponent(player.sessionId)}/connection-quality`,
    {
      quality: 'good',
      rtt_ms: 45,
      packet_loss_pct: 0,
      jitter_ms: 5,
      transport: 'server',
    },
    'connection_quality',
    [200],
    'mutation',
  );
}

export function liveHttp(data) {
  const player = playerFor(data, true);
  if (current.resultLoadDone) {
    sleep(5);
    return;
  }
  // La proposta/conferma avviene prima delle letture finali: dopo l'invio o
  // la verifica il VU si mette in attesa e non manda quality a match chiuso.
  if (maybeCompleteResult(player)) {
    current.resultLoadDone = true;
    sleep(5);
    return;
  }
  if (INCLUDE_FRONTEND) frontendRead(player);
  if (INCLUDE_BACKEND_READS) backendReads(player);
  quality(player);
  sleep(5);
}

export function signalingBurst(data) {
  // Il refresh e centralizzato nei VU live_http: questo scenario usa il token
  // fresco restituito dal setup e non puo competere sulla stessa rotazione.
  const player = playerFor(data, false);
  const session = encodeURIComponent(player.sessionId);
  const request = (method, path, body, operation, expectedStatuses = [200], kind = 'read') =>
    INCLUDE_FRONTEND_SIGNALING
      ? frontendRequest(player, method, path, body, operation, expectedStatuses, kind)
      : apiRequest(player, method, path, body, operation, expectedStatuses, kind);
  if (INCLUDE_FRONTEND_SIGNALING) {
    // Il BFF non espone una route authorize separata: ICE e messaggi sono
    // entrambi autorizzati dal backend sullo stesso webcam_session_id.
    request(
      'GET',
      `/api/tournaments/ice-servers?session_id=${session}`,
      undefined,
      'signal_ice',
    );
  } else {
    const authorized = request(
      'GET',
      `/api/v1/signaling/${session}/authorize`,
      undefined,
      'signal_authorize',
    );
    const authorization = unwrap(json(authorized));
    if (!authorization || authorization.role !== player.role) {
      criticalFailures.add(1, { operation: 'signal_authorize', reason: 'role_mismatch' });
    }
    request(
      'GET',
      `/api/v1/signaling/ice-servers?session_id=${session}`,
      undefined,
      'signal_ice',
    );
  }
  const messagePath = INCLUDE_FRONTEND_SIGNALING
    ? `/api/tournaments/signaling/${session}`
    : `/api/v1/signaling/${session}/messages`;
  request(
    'POST',
    messagePath,
    {
      from: player.role,
      kind: 'candidate',
      data: {
        attemptId: `load-${player.tournamentId}`,
        payload: { candidate: 'load-test-candidate' },
      },
    },
    'signal_post',
    [200],
    'mutation',
  );
  // Non partire dalla seq appena inviata: l'avversario potrebbe aver scritto
  // prima e quel messaggio va osservato dal primo poll. Il client reale
  // filtra i propri frame dopo averli ricevuti.
  let since = 0;
  for (let index = 0; index < 5; index += 1) {
    const pollPath = `${messagePath}?role=${player.role}&since=${since}`;
    const polled = request('GET', pollPath, undefined, 'signal_poll');
    const payload = unwrap(json(polled));
    const messages = payload && Array.isArray(payload.messages) ? payload.messages : [];
    for (const message of messages) {
      if (message && Number.isSafeInteger(message.seq)) since = Math.max(since, message.seq);
    }
    sleep(0.6);
  }
}
