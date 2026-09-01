import {
  COMPLETE_RESULTS,
  INCLUDE_BACKEND_READS,
  INCLUDE_CHAT_WS,
  INCLUDE_EVENTS_WS,
  INCLUDE_FRONTEND,
  INCLUDE_SIGNALING,
  MAX_PLAYERS,
  PROFILE,
  STAGES,
} from './config.js';
import { preparePlayers } from './lib/setup.js';
import { liveHttp, signalingBurst } from './scenarios/http.js';
import { matchChatWs, tournamentEventsWs } from './scenarios/websocket.js';

const scenarios = {};
const ramping = (execName) => ({
  executor: 'ramping-vus',
  exec: execName,
  startVUs: 0,
  stages: STAGES,
  gracefulRampDown: '10s',
  gracefulStop: '15s',
});

if (INCLUDE_FRONTEND || INCLUDE_BACKEND_READS) scenarios.live_http = ramping('liveHttp');
if (INCLUDE_EVENTS_WS) scenarios.tournament_events_ws = ramping('tournamentEventsWs');
if (INCLUDE_CHAT_WS) scenarios.match_chat_ws = ramping('matchChatWs');
if (INCLUDE_SIGNALING) {
  scenarios.signaling_burst = {
    executor: 'per-vu-iterations',
    exec: 'signalingBurst',
    vus: MAX_PLAYERS,
    iterations: 1,
    maxDuration: '5m',
  };
}

const thresholds = {
  critical_failures: [{ threshold: 'count==0', abortOnFail: true, delayAbortEval: '10s' }],
  rate_limited_responses: ['count==0'],
  server_error_responses: ['count==0'],
  mutation_duration: ['p(95)<1000', 'p(99)<2000'],
  lifecycle_completed: ['rate==1'],
  checks: ['rate>0.995'],
};
if (INCLUDE_BACKEND_READS || INCLUDE_SIGNALING) {
  thresholds['read_duration{kind:read}'] = ['p(95)<1000', 'p(99)<2000'];
}
if (INCLUDE_FRONTEND) {
  thresholds['read_duration{kind:frontend}'] = ['p(95)<2000', 'p(99)<3000'];
}
if (INCLUDE_EVENTS_WS || INCLUDE_CHAT_WS) {
  thresholds.ws_authenticated = ['rate>0.995'];
  thresholds.ws_ticket_to_ack = ['p(95)<1000', 'p(99)<2000'];
  thresholds.ws_unexpected_close = ['count==0'];
}
if (COMPLETE_RESULTS) thresholds.result_completed = ['rate==1'];

export const options = {
  scenarios,
  // 200 giocatori = 100 coppie; il setup serializza create/join/ready e il
  // delay anti-burst, quindi dieci minuti non bastano in un ambiente sano.
  setupTimeout: '30m',
  teardownTimeout: '10m',
  noConnectionReuse: false,
  userAgent: `EbartexTournamentLoadTest/${PROFILE}`,
  thresholds,
};

export function setup() {
  return preparePlayers();
}

export { liveHttp, signalingBurst, matchChatWs, tournamentEventsWs };

// I risultati non vengono dichiarati qui: il teardown riceverebbe copie stale
// dei refresh token dopo le rotazioni dei VU e i socket sarebbero gia chiusi.
export function teardown() {}

export function handleSummary(data) {
  const path = __ENV.SUMMARY_EXPORT || `/results/${PROFILE}-summary.json`;
  return {
    stdout: `\nReport JSON: ${path}\n`,
    [path]: JSON.stringify(data, null, 2),
  };
}
