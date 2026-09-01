import http from 'k6/http';
import ws from 'k6/ws';
import exec from 'k6/execution';
import { check } from 'k6';
import { BROWSER_ORIGIN, COMPLETE_RESULTS, WS_ORIGIN } from '../config.js';
import { apiRequest, json, unwrap } from '../lib/api.js';
import { resultTriggerReached } from '../lib/results.js';
import {
  criticalFailures,
  rateLimited,
  serverErrors,
  wsAuthenticated,
  wsTicketToAck,
  wsUnexpectedClose,
} from '../lib/metrics.js';

const HOLD_MS = 24 * 60 * 60 * 1_000;

function scenarioIsEnding() {
  // ramping-vus interrompe i socket ancora aperti durante l'ultima discesa.
  // k6/ws emette close anche per quella chiusura pianificata, quindi non va
  // confusa con una chiusura del servizio mentre lo scenario e attivo.
  const progress = Number(exec.scenario.progress);
  return Number.isFinite(progress) && progress >= 0.99;
}

function playerFor(data) {
  const index = (exec.vu.idInTest - 1) % data.players.length;
  // Il refresh token ruota atomicamente: i VU WS usano il token fresco del
  // setup, mentre la rotazione durante il run resta proprieta dei VU HTTP.
  return { ...data.players[index] };
}

function openAuthenticatedSocket(player, kind) {
  const isChat = kind === 'chat';
  const resourceId = isChat ? player.matchId : player.tournamentId;
  const encodedResourceId = encodeURIComponent(resourceId);
  const ticketPath = isChat
    ? `/api/tournaments/match/${encodedResourceId}/chat-ticket`
    : `/api/tournaments/tournament/${encodedResourceId}/events-ticket`;
  const operation = isChat ? 'chat_ticket' : 'events_ticket';
  const ticketResponse = apiRequest(player, 'POST', ticketPath, undefined, operation, [200], 'mutation');
  const capability = unwrap(json(ticketResponse));
  const ticket = capability && capability.ticket;
  if (typeof ticket !== 'string') {
    criticalFailures.add(1, { operation, reason: 'missing_ticket' });
    wsAuthenticated.add(false, { channel: kind });
    return;
  }
  const path = isChat
    ? `/api/tournaments/match/${encodedResourceId}/chat`
    : `/api/tournaments/tournament/${encodedResourceId}/events`;
  const startedAt = Date.now();
  let authenticated = false;
  let expectedClose = false;
  const response = ws.connect(
    `${WS_ORIGIN}${path}`,
    { headers: { Origin: BROWSER_ORIGIN }, tags: { channel: kind } },
    (socket) => {
      socket.on('open', () => socket.send(JSON.stringify({ ticket })));
      socket.on('message', (raw) => {
        let message;
        try {
          message = JSON.parse(raw);
        } catch {
          return;
        }
        if (message.event !== 'authenticated' || authenticated) return;
        authenticated = true;
        wsAuthenticated.add(true, { channel: kind });
        wsTicketToAck.add(Date.now() - startedAt, { channel: kind });
        const heartbeat = isChat ? { event: 'presence' } : { event: 'heartbeat' };
        socket.setInterval(() => socket.send(JSON.stringify(heartbeat)), isChat ? 3_000 : 15_000);
        if (isChat) {
          socket.setInterval(
            () => socket.send(JSON.stringify({ text: `load-${player.label}` })),
            30_000,
          );
        }
      });
      socket.on('error', () => {
        if (!scenarioIsEnding()) {
          criticalFailures.add(1, { operation: `${kind}_ws`, reason: 'socket_error' });
        }
      });
      socket.on('close', () => {
        const resultHasStarted = COMPLETE_RESULTS && resultTriggerReached();
        const plannedRampDown = scenarioIsEnding() && resultHasStarted;
        if (!expectedClose && !plannedRampDown) {
          wsUnexpectedClose.add(1, { channel: kind });
        }
      });
      socket.setTimeout(() => {
        expectedClose = true;
        socket.close();
      }, HOLD_MS);
    },
  );
  if (!authenticated) wsAuthenticated.add(false, { channel: kind });
  const upgradeOk = Boolean(response && response.status === 101);
  if (!upgradeOk) {
    const status = response && response.status ? response.status : 0;
    criticalFailures.add(1, { operation: `${kind}_ws_upgrade`, status: String(status) });
    if (status === 429) rateLimited.add(1, { operation: `${kind}_ws_upgrade` });
    if (status >= 500) serverErrors.add(1, { operation: `${kind}_ws_upgrade` });
  }
  check(response, { [`${kind} upgrade HTTP 101`]: () => upgradeOk });
}

export function tournamentEventsWs(data) {
  openAuthenticatedSocket(playerFor(data), 'events');
}

export function matchChatWs(data) {
  openAuthenticatedSocket(playerFor(data), 'chat');
}
