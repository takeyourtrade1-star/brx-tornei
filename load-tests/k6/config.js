const PROFILE_STAGES = {
  smoke: '5s:2,30s:2,5s:0',
  rehearsal: '2m:30,20m:30,30s:0',
  capacity: '1m:20,2m:50,3m:100,4m:200,30s:200,30s:0',
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

function canonicalOrigin(name, fallback) {
  return parseOrigin(__ENV[name] || fallback, name, ['http:', 'https:']).origin;
}

function canonicalWebSocketOrigin(name, fallback) {
  return parseOrigin(__ENV[name] || fallback, name, ['ws:', 'wss:']).origin;
}

function parseOrigin(rawValue, name, protocols) {
  const raw = String(rawValue || '').trim();
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]+)\/?$/i.exec(raw);
  if (!match) throw new Error(`${name} non e un origin valido`);
  const protocol = `${match[1].toLowerCase()}:`;
  if (!protocols.includes(protocol)) {
    throw new Error(`${name} usa uno schema non supportato`);
  }
  const authority = match[2];
  if (!authority || authority.includes('@') || /\s/.test(authority)) {
    throw new Error(`${name} deve contenere solo scheme e host`);
  }

  let hostname;
  let port = null;
  if (authority.startsWith('[')) {
    const closingBracket = authority.indexOf(']');
    if (closingBracket < 0) throw new Error(`${name} contiene un host IPv6 non valido`);
    hostname = authority.slice(1, closingBracket);
    const suffix = authority.slice(closingBracket + 1);
    if (suffix) {
      if (!suffix.startsWith(':')) throw new Error(`${name} contiene una porta non valida`);
      port = suffix.slice(1);
    }
    if (!/^[0-9a-f:.]+$/i.test(hostname)) {
      throw new Error(`${name} contiene un host IPv6 non valido`);
    }
  } else {
    const separator = authority.lastIndexOf(':');
    if (separator >= 0) {
      if (authority.indexOf(':') !== separator) {
        throw new Error(`${name} richiede parentesi quadre per un host IPv6`);
      }
      hostname = authority.slice(0, separator);
      port = authority.slice(separator + 1);
    } else {
      hostname = authority;
    }
    if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(hostname)) {
      throw new Error(`${name} contiene un host non valido`);
    }
  }
  if (port !== null && (!/^\d+$/.test(port) || Number(port) > 65535)) {
    throw new Error(`${name} contiene una porta non valida`);
  }
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, '');
  const renderedHostname = normalizedHostname.includes(':')
    ? `[${normalizedHostname}]`
    : normalizedHostname;
  return {
    origin: `${protocol}//${renderedHostname}${port === null ? '' : `:${port}`}`,
    hostname: normalizedHostname,
  };
}

function parseStages(raw) {
  const stages = raw.split(',').map((item) => {
    const [duration, rawTarget, extra] = item.trim().split(':');
    const target = Number(rawTarget);
    if (
      !duration ||
      !/^\d+(?:\.\d+)?(?:ms|s|m|h|d)$/.test(duration) ||
      extra !== undefined ||
      !Number.isInteger(target) ||
      target < 0
    ) {
      throw new Error(`Stage non valido: ${item}. Usa durata:giocatori`);
    }
    if (target % 2 !== 0) throw new Error(`Lo stage ${item} deve avere giocatori pari`);
    return { duration, target, seconds: durationToSeconds(duration) };
  });
  if (!stages.length || !stages.some(({ target }) => target > 0)) {
    throw new Error('Serve almeno uno stage con giocatori > 0');
  }
  return stages;
}

function durationToSeconds(duration) {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/.exec(duration);
  if (!match) throw new Error(`Durata stage non valida: ${duration}`);
  const factors = { ms: 0.001, s: 1, m: 60, h: 3600, d: 86400 };
  const seconds = Number(match[1]) * factors[match[2]];
  if (!Number.isFinite(seconds)) throw new Error(`Durata stage non valida: ${duration}`);
  return seconds;
}

function localPlayers(globalPlayers, generatorCount, generatorIndex) {
  let pairs = 0;
  for (let pair = 0; pair < globalPlayers / 2; pair += 1) {
    if (pair % generatorCount === generatorIndex) pairs += 1;
  }
  return pairs * 2;
}

function normalizedHostname(origin) {
  return parseOrigin(origin, 'origin', ['http:', 'https:', 'ws:', 'wss:']).hostname;
}

function confirmationHosts() {
  const configured = [__ENV.LOAD_TEST_CONFIRM_HOSTS, __ENV.LOAD_TEST_CONFIRM_HOST]
    .filter((value) => value !== undefined && value !== '')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().toLowerCase().replace(/\.$/, ''))
    .filter(Boolean);
  const invalid = configured.find(
    (host) =>
      host === '*' ||
      host.includes('://') ||
      host.includes('/') ||
      /\s/.test(host) ||
      (!/^[a-z0-9.-]+$/.test(host) && !/^\[?[0-9a-f:]+\]?$/.test(host)),
  );
  if (invalid) {
    throw new Error(
      `LOAD_TEST_CONFIRM_HOSTS contiene un host non valido: ${invalid}. Usa solo hostname esatti separati da virgola`,
    );
  }
  return new Set(configured.map((host) => host.replace(/^\[/, '').replace(/\]$/, '')));
}

function isLocalHostname(hostname) {
  return new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0', 'host.docker.internal']).has(hostname);
}

export function assertRemoteConfirmation(...origins) {
  const remoteHosts = origins
    .filter(Boolean)
    .map(normalizedHostname)
    .filter((host) => !isLocalHostname(host));
  const confirmed = confirmationHosts();
  const missing = [...new Set(remoteHosts)].filter((host) => !confirmed.has(host));
  if (missing.length > 0) {
    throw new Error(
      `Target remoto non autorizzato: ${missing.join(', ')}. Imposta LOAD_TEST_CONFIRM_HOSTS=${missing.join(',')} (hostname esatti)`,
    );
  }
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
  20,
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
export const FORMAT = __ENV.LOAD_FORMAT || 'modern';
export const MODE = 'heads-up';

if (![INCLUDE_FRONTEND, INCLUDE_BACKEND_READS, INCLUDE_EVENTS_WS, INCLUDE_CHAT_WS].some(Boolean)) {
  throw new Error('Abilita almeno uno scenario di carico');
}

export const STAGE_TIMELINE = (() => {
  let elapsedSeconds = 0;
  return GLOBAL_STAGES.map(({ duration, target, seconds }) => {
    const startSeconds = elapsedSeconds;
    elapsedSeconds += seconds;
    return { duration, target, seconds, startSeconds, endSeconds: elapsedSeconds };
  });
})();
export const SCENARIO_DURATION_SECONDS = STAGE_TIMELINE[STAGE_TIMELINE.length - 1].endSeconds;
const globalMaxPlayers = Math.max(...GLOBAL_STAGES.map(({ target }) => target));
const peakEndIndex = GLOBAL_STAGES.reduce(
  (last, stage, index) => (stage.target === globalMaxPlayers ? index : last),
  -1,
);
let peakStartIndex = peakEndIndex;
while (peakStartIndex > 0 && GLOBAL_STAGES[peakStartIndex - 1].target === globalMaxPlayers) {
  peakStartIndex -= 1;
}
const peakStartSeconds = STAGE_TIMELINE[peakStartIndex].startSeconds;
const descentStartSeconds = STAGE_TIMELINE[peakEndIndex].endSeconds;
const peakPlateauSeconds = descentStartSeconds - peakStartSeconds;
const hasFinalRampDown =
  peakEndIndex >= 0 &&
  peakEndIndex < GLOBAL_STAGES.length - 1 &&
  GLOBAL_STAGES[GLOBAL_STAGES.length - 1].target === 0 &&
  GLOBAL_STAGES.slice(peakEndIndex + 1).every(({ target }) => target < globalMaxPlayers);

if (COMPLETE_RESULTS) {
  if (!INCLUDE_FRONTEND && !INCLUDE_BACKEND_READS) {
    throw new Error('LOAD_COMPLETE_RESULTS=true richiede lo scenario live_http attivo');
  }
  if (!Number.isFinite(SCENARIO_DURATION_SECONDS) || SCENARIO_DURATION_SECONDS <= 0) {
    throw new Error('Gli stage devono avere una durata totale positiva');
  }
  if (!hasFinalRampDown) {
    throw new Error(
      'LOAD_COMPLETE_RESULTS=true richiede un plateau al massimo seguito da uno stage finale a 0',
    );
  }
  if (peakPlateauSeconds < RESULT_TRIGGER_LEAD_SECONDS + 2) {
    throw new Error(
      `Il plateau massimo (${peakPlateauSeconds}s) deve lasciare almeno ${RESULT_TRIGGER_LEAD_SECONDS + 2}s prima della discesa`,
    );
  }
  if (
    RESULT_TRIGGER_LEAD_SECONDS <
    RESULT_CONFIRM_DELAY_SECONDS + RESULT_SETTLE_TIMEOUT_SECONDS + 5
  ) {
    throw new Error(
      'LOAD_RESULT_TRIGGER_LEAD_SECONDS deve coprire conferma, settlement e margine di rete',
    );
  }
}
export const RESULT_TRIGGER_SECONDS = Math.max(
  0,
  descentStartSeconds - RESULT_TRIGGER_LEAD_SECONDS,
);
export const RESULT_TRIGGER_PROGRESS = SCENARIO_DURATION_SECONDS > 0
  ? RESULT_TRIGGER_SECONDS / SCENARIO_DURATION_SECONDS
  : 1;

assertRemoteConfirmation(
  BACKEND_URL,
  INCLUDE_FRONTEND || INCLUDE_FRONTEND_SIGNALING ? FRONTEND_URL : '',
  INCLUDE_FRONTEND || INCLUDE_FRONTEND_SIGNALING || INCLUDE_EVENTS_WS || INCLUDE_CHAT_WS
    ? BROWSER_ORIGIN
    : '',
  INCLUDE_EVENTS_WS || INCLUDE_CHAT_WS ? WS_ORIGIN : '',
  __ENV.AUTH_BASE_URL ? AUTH_URL : '',
);

export function shardPair(globalPairIndex) {
  return globalPairIndex % GENERATOR_COUNT === GENERATOR_INDEX;
}
