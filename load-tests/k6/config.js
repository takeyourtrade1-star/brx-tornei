import { assertRemoteConfirmation, canonicalOrigin, canonicalWebSocketOrigin } from './lib/origins.js';
import { buildTimeline, localPlayers, parseStages } from './lib/stages.js';

const PROFILE_STAGES = {
  smoke: '5s:2,45s:2,5s:0',
  rehearsal: '2m:30,20m:30,30s:0',
  // Il picco va misurato a regime: plateau di 3 minuti con tutti i 200 VU
  // attivi prima della discesa, cosi il risultato si chiude nel cuore dello
  // scenario e non in competizione con lo stop dei VU.
  capacity: '1m:20,2m:50,3m:100,4m:200,3m:200,1m:0',
  soak: '2m:30,60m:30,30s:0',
};

function boolEnv(name, fallback) {
  const value = __ENV[name];
  if (value === undefined || value === '') return fallback;
  if (value === '1' || value.toLowerCase() === 'true') return true;
  if (value === '0' || value.toLowerCase() === 'false') return false;
  throw new Error(`${name} deve valere true/false oppure 1/0`);
}

function integerEnv(name, fallback, minimum = 0) {
  const value = __ENV[name];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(`${name} deve essere un intero >= ${minimum}`);
  }
  return parsed;
}

function numberEnv(name, fallback, minimum = 0) {
  const value = __ENV[name];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new Error(`${name} deve essere un numero >= ${minimum}`);
  }
  return parsed;
}

export const PROFILE = __ENV.LOAD_PROFILE || 'smoke';
if (!PROFILE_STAGES[PROFILE] && !__ENV.LOAD_STAGES) {
  throw new Error(`LOAD_PROFILE sconosciuto: ${PROFILE}`);
}

export const BACKEND_URL = canonicalOrigin(
  'TOURNAMENTS_BASE_URL',
  'http://host.docker.internal:8000',
);
export const FRONTEND_URL = canonicalOrigin(
  'TOURNAMENTS_FRONTEND_URL',
  'http://host.docker.internal:3001',
);
export const AUTH_URL = canonicalOrigin('AUTH_BASE_URL', 'https://api.ebartex.com');
export const WS_ORIGIN = canonicalWebSocketOrigin(
  'TOURNAMENTS_WS_ORIGIN',
  BACKEND_URL.replace(/^http/, 'ws'),
);
export const BROWSER_ORIGIN = canonicalOrigin('BROWSER_ORIGIN', FRONTEND_URL);
// open() resolves relative paths from lib/identities.js, not from main.js.
export const USERS_FILE = __ENV.USERS_FILE || '../users.example.json';

export const GENERATOR_COUNT = integerEnv('LOAD_GENERATOR_COUNT', 1, 1);
export const GENERATOR_INDEX = integerEnv('LOAD_GENERATOR_INDEX', 0, 0);
if (GENERATOR_INDEX >= GENERATOR_COUNT) {
  throw new Error('LOAD_GENERATOR_INDEX deve essere minore di LOAD_GENERATOR_COUNT');
}

export const GLOBAL_STAGES = parseStages(
  __ENV.LOAD_STAGES || PROFILE_STAGES[PROFILE],
);
export const STAGES = GLOBAL_STAGES.map(({ duration, target }) => ({
  duration,
  target: localPlayers(target, GENERATOR_COUNT, GENERATOR_INDEX),
}));
export const MAX_PLAYERS = Math.max(...STAGES.map(({ target }) => target));
if (MAX_PLAYERS === 0) {
  throw new Error('Questo shard non riceve giocatori negli stage configurati');
}

export const INCLUDE_FRONTEND = boolEnv('LOAD_INCLUDE_FRONTEND', true);
// La pagina live effettua gia le letture RSC/BFF: senza override non duplicare
// lo stesso traffico con il protocol test diretto.
export const INCLUDE_BACKEND_READS = boolEnv(
  'LOAD_INCLUDE_BACKEND_READS',
  !INCLUDE_FRONTEND,
);
export const INCLUDE_EVENTS_WS = boolEnv('LOAD_INCLUDE_EVENTS_WS', true);
export const INCLUDE_CHAT_WS = boolEnv('LOAD_INCLUDE_CHAT_WS', true);
export const INCLUDE_SIGNALING = boolEnv('LOAD_INCLUDE_SIGNALING', true);
export const INCLUDE_QUALITY = boolEnv('LOAD_INCLUDE_QUALITY', true);
// Il signaling browser passa dal BFF Next; il protocol test diretto resta
// utile per isolare il Tournament Service. Attivarlo esplicitamente quando si
// vuole misurare anche il limite peer dell'egress Hostinger.
export const INCLUDE_FRONTEND_SIGNALING = boolEnv('LOAD_SIGNALING_VIA_FRONTEND', false);
export const COMPLETE_RESULTS = boolEnv('LOAD_COMPLETE_RESULTS', true);
export const CLEANUP_BEFORE = boolEnv('LOAD_CLEANUP_BEFORE', true);
export const PAIR_DELAY_SECONDS = numberEnv('LOAD_PAIR_DELAY_SECONDS', 0);
export const SETUP_TOKEN_BUFFER_SECONDS = numberEnv(
  'LOAD_SETUP_TOKEN_BUFFER_SECONDS',
  300,
  30,
);
export const RESULT_TRIGGER_LEAD_SECONDS = numberEnv(
  'LOAD_RESULT_TRIGGER_LEAD_SECONDS',
  30,
  1,
);
export const RESULT_CONFIRM_DELAY_SECONDS = numberEnv(
  'LOAD_RESULT_CONFIRM_DELAY_SECONDS',
  2,
  0,
);
export const RESULT_SETTLE_TIMEOUT_SECONDS = numberEnv(
  'LOAD_RESULT_SETTLE_TIMEOUT_SECONDS',
  10,
  1,
);
// Attesa massima della proposal del player 1 prima che il player 2 inizi i
// tentativi di conferma: evita conferme respinte per una proposal non ancora
// visibile.
export const PROPOSAL_POLL_SECONDS = 3;
export const FORMAT = __ENV.LOAD_FORMAT || 'modern';
export const MODE = 'heads-up';

if (![INCLUDE_FRONTEND, INCLUDE_BACKEND_READS, INCLUDE_EVENTS_WS, INCLUDE_CHAT_WS].some(Boolean)) {
  throw new Error('Abilita almeno uno scenario di carico');
}

const timeline = buildTimeline(GLOBAL_STAGES);
export const STAGE_TIMELINE = timeline.timeline;
export const SCENARIO_DURATION_SECONDS = timeline.scenarioDurationSeconds;

// Finestre in cui e k6 a ridurre o spegnere i VU: le chiusure WebSocket in
// questi intervalli sono pianificate dal test e non contano come inattese.
// Coprono le discese di profilo, il fine test e il gracefulStop (15s).
export const PLANNED_STOP_WINDOWS = (() => {
  const windows = [];
  for (let index = 1; index < GLOBAL_STAGES.length; index += 1) {
    if (GLOBAL_STAGES[index].target < GLOBAL_STAGES[index - 1].target) {
      windows.push({
        start: STAGE_TIMELINE[index].startSeconds,
        end: STAGE_TIMELINE[index].endSeconds,
      });
    }
  }
  const last = STAGE_TIMELINE[STAGE_TIMELINE.length - 1];
  const lastWindow = windows[windows.length - 1];
  if (!lastWindow || lastWindow.end !== last.endSeconds) {
    windows.push({ start: last.endSeconds, end: last.endSeconds });
  }
  return windows.map(({ start, end }) => ({ start, end: end + 15 }));
})();

if (COMPLETE_RESULTS) {
  if (!INCLUDE_FRONTEND && !INCLUDE_BACKEND_READS) {
    throw new Error('LOAD_COMPLETE_RESULTS=true richiede lo scenario live_http attivo');
  }
  if (!Number.isFinite(SCENARIO_DURATION_SECONDS) || SCENARIO_DURATION_SECONDS <= 0) {
    throw new Error('Gli stage devono avere una durata totale positiva');
  }
  if (!timeline.hasFinalRampDown) {
    throw new Error(
      'LOAD_COMPLETE_RESULTS=true richiede un plateau al massimo seguito da uno stage finale a 0',
    );
  }
  if (timeline.peakPlateauSeconds < RESULT_TRIGGER_LEAD_SECONDS + 2) {
    throw new Error(
      `Il plateau massimo (${timeline.peakPlateauSeconds}s) deve lasciare almeno ${RESULT_TRIGGER_LEAD_SECONDS + 2}s prima della discesa`,
    );
  }
  const resultBudgetSeconds = RESULT_CONFIRM_DELAY_SECONDS
    + PROPOSAL_POLL_SECONDS
    + RESULT_SETTLE_TIMEOUT_SECONDS;
  if (RESULT_TRIGGER_LEAD_SECONDS < resultBudgetSeconds + 10) {
    throw new Error(
      'LOAD_RESULT_TRIGGER_LEAD_SECONDS deve coprire attesa proposal, conferma, settlement e la verifica dell\'host',
    );
  }
}
// La chiusura del risultato avviene nel cuore dello scenario, con la coppia
// ancora attiva: la finestra si apre lead secondi prima della discesa finale.
export const RESULT_TRIGGER_SECONDS = Math.max(
  0,
  timeline.descentStartSeconds - RESULT_TRIGGER_LEAD_SECONDS,
);

assertRemoteConfirmation(
  BACKEND_URL,
  INCLUDE_FRONTEND || INCLUDE_FRONTEND_SIGNALING ? FRONTEND_URL : '',
  INCLUDE_FRONTEND || INCLUDE_FRONTEND_SIGNALING || INCLUDE_EVENTS_WS || INCLUDE_CHAT_WS
    ? BROWSER_ORIGIN
    : '',
  INCLUDE_EVENTS_WS || INCLUDE_CHAT_WS ? WS_ORIGIN : '',
  __ENV.AUTH_BASE_URL ? AUTH_URL : '',
);
