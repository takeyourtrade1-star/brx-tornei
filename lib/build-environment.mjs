import { isIP } from 'node:net';

const REQUIRED_PRODUCTION_ORIGINS = [
  'AUTH_API_URL',
  'SYNC_API_URL',
  'TOURNAMENTS_API_URL',
  'NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_MAIN_SITE_URL',
];

/**
 * Integrations the tournaments platform runs without, and does run without in
 * production today. The application already handles their absence — the webcam
 * relay falls back to its in-memory store, the BRX Match proxy refuses the
 * route — so requiring their credentials to build turns a deployment that
 * works into one that cannot be rebuilt.
 *
 * Each group stays all-or-nothing. Half a configuration is the state that
 * actually causes harm: a URL with no token, or a token pointing nowhere.
 */
const OPTIONAL_INTEGRATIONS = [
  {
    label: 'BRX Match',
    origins: ['BRX_MATCH_API_URL', 'BRX_MATCH_ALLOWED_ORIGIN'],
    values: [
      'BRX_MATCH_INTERNAL_TOKEN',
      'BRX_MATCH_INTERNAL_CALLER',
      'BRX_MATCH_EDGE_MODEL_SHA256',
    ],
  },
  {
    label: 'Upstash Redis',
    origins: ['UPSTASH_REDIS_REST_URL'],
    values: ['UPSTASH_REDIS_REST_TOKEN', 'UPSTASH_REDIS_ALLOWED_HOSTNAME'],
  },
];

const OPTIONAL_HTTPS_ORIGINS = [
  'NEXT_PUBLIC_CDN_URL',
  'NEXT_PUBLIC_MATCH_GAP_UPLOAD_ORIGIN',
  'MEILISEARCH_URL',
];

const FORBIDDEN_PUBLIC_SERVICE_VALUES = [
  'NEXT_PUBLIC_AUTH_API_URL',
  'NEXT_PUBLIC_SYNC_API_URL',
  'NEXT_PUBLIC_TOURNAMENTS_API_URL',
  'NEXT_PUBLIC_MEILISEARCH_URL',
  'NEXT_PUBLIC_MEILISEARCH_HOST',
  'NEXT_PUBLIC_MEILISEARCH_API_KEY',
];

const REQUIRED_PRODUCTION_VALUES = [
  ...REQUIRED_PRODUCTION_ORIGINS,
  'TRUSTED_HTTPS_HOSTNAMES',
  'TRUSTED_UPSTREAM_HOSTS',
  'WEBCAM_RELAY_SECRET',
];

const DNS_HOSTNAME =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Parses an exact, comma-separated DNS hostname allowlist. Wildcards, ports,
 * IP literals, URLs and single-label/local names are intentionally rejected.
 *
 * @param {string | undefined} raw
 * @returns {ReadonlySet<string>}
 */
export function parseTrustedHttpsHostnames(raw) {
  if (!raw?.trim()) {
    throw new Error('TRUSTED_HTTPS_HOSTNAMES must list explicit production hostnames');
  }

  const values = raw.split(',').map((value) => value.trim());
  if (values.some((value) => !value)) {
    throw new Error('TRUSTED_HTTPS_HOSTNAMES contains an empty hostname');
  }

  const hostnames = new Set();
  for (const hostname of values) {
    if (
      hostname !== hostname.toLowerCase() ||
      isIP(hostname) !== 0 ||
      !DNS_HOSTNAME.test(hostname)
    ) {
      throw new Error(
        'TRUSTED_HTTPS_HOSTNAMES accepts only lowercase, explicit DNS hostnames',
      );
    }
    hostnames.add(hostname);
  }

  return hostnames;
}

/**
 * Validates and canonicalizes an origin without ever including its value in an
 * error message (build logs must not become a source of credential leakage).
 *
 * @param {string} name
 * @param {string | undefined} raw
 * @param {'https:' | 'wss:'} protocol
 * @param {ReadonlySet<string>} trustedHostnames
 * @returns {string}
 */
function validateOrigin(name, raw, protocol, trustedHostnames) {
  if (!raw) throw new Error(`${name} is required`);
  if (raw !== raw.trim() || /[^\x20-\x7e]/.test(raw)) {
    throw new Error(`${name} must be an ASCII origin without surrounding whitespace`);
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${name} must be an absolute ${protocol.slice(0, -1)} origin`);
  }

  if (url.protocol !== protocol) {
    throw new Error(`${name} must use ${protocol}//`);
  }
  if (url.username || url.password) {
    throw new Error(`${name} must not contain credentials`);
  }
  if (url.port) {
    throw new Error(`${name} must use the default TLS port`);
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${name} must not contain a path, query string, or fragment`);
  }
  if (raw !== url.origin && raw !== `${url.origin}/`) {
    throw new Error(`${name} must be a canonical origin`);
  }
  if (!trustedHostnames.has(url.hostname)) {
    throw new Error(`${name} hostname is not in TRUSTED_HTTPS_HOSTNAMES`);
  }

  return url.origin;
}

/**
 * @param {string} httpsOrigin
 * @returns {string}
 */
export function deriveTournamentWebSocketOrigin(httpsOrigin) {
  const url = new URL(httpsOrigin);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('Tournament HTTPS origin is not canonical');
  }
  url.protocol = 'wss:';
  return url.origin;
}

/**
 * Everything the build actually received, printed alongside a rejection.
 *
 * A validator that only says "no" turns one wrong character into a round trip
 * per attempt, and a build takes minutes. Hostnames and origins are public —
 * they ship inside the client bundle — so showing them costs nothing and ends
 * the guessing. Secrets are never read here, only these two lists and the
 * origins they are checked against.
 *
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} environment
 * @param {ReadonlySet<string>} trustedHostnames
 * @param {ReadonlySet<string>} trustedUpstreamHostnames
 * @returns {string}
 */
function describeOriginConfiguration(
  environment,
  trustedHostnames,
  trustedUpstreamHostnames,
) {
  const lines = ['What this build received:'];

  lines.push(`  TRUSTED_HTTPS_HOSTNAMES (${trustedHostnames.size}):`);
  for (const hostname of trustedHostnames) lines.push(`    ${hostname}`);
  lines.push(`  TRUSTED_UPSTREAM_HOSTS (${trustedUpstreamHostnames.size}):`);
  for (const hostname of trustedUpstreamHostnames) lines.push(`    ${hostname}`);

  lines.push('  Origins, and whether their hostname is trusted:');
  for (const name of [
    ...REQUIRED_PRODUCTION_ORIGINS,
    ...OPTIONAL_HTTPS_ORIGINS,
    ...OPTIONAL_INTEGRATIONS.flatMap((integration) => integration.origins),
  ]) {
    const raw = environment[name]?.trim();
    if (!raw) {
      lines.push(`    ${name} = (not set)`);
      continue;
    }
    let hostname;
    try {
      hostname = new URL(raw).hostname;
    } catch {
      lines.push(`    ${name} = ${raw}  <- not a URL`);
      continue;
    }
    const verdict = trustedHostnames.has(hostname) ? 'trusted' : 'NOT TRUSTED';
    lines.push(`    ${name} = ${raw}  (host ${hostname}: ${verdict})`);
  }

  return lines.join('\n');
}

/**
 * Fail-fast validation used by next.config.mjs during production build/start.
 *
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} environment
 * @returns {{ origins: Readonly<Record<string, string>>, tournamentWebSocketOrigin: string } | null}
 */
export function validateProductionEnvironment(environment) {
  if (environment.NODE_ENV !== 'production') return null;

  if (
    environment.NEXT_PUBLIC_MATCH_GAP_RECORDING_ENABLED === 'true' &&
    !environment.NEXT_PUBLIC_MATCH_GAP_UPLOAD_ORIGIN?.trim()
  ) {
    throw new Error(
      'NEXT_PUBLIC_MATCH_GAP_UPLOAD_ORIGIN is required when gap recording is enabled',
    );
  }

  const trustedClientIpHeader = environment.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (
    trustedClientIpHeader &&
    ![
      'cloudfront-viewer-address',
      'cf-connecting-ip',
      'x-vercel-forwarded-for',
    ].includes(trustedClientIpHeader)
  ) {
    throw new Error('TRUSTED_CLIENT_IP_HEADER is not an allowed infrastructure header');
  }
  const trustedProxyHops = environment.TRUSTED_PROXY_HOPS?.trim();
  if (trustedProxyHops && (!/^[1-9]\d?$/.test(trustedProxyHops) || Number(trustedProxyHops) > 10)) {
    throw new Error('TRUSTED_PROXY_HOPS must be an integer between 1 and 10');
  }

  const exposedServiceValues = FORBIDDEN_PUBLIC_SERVICE_VALUES.filter(
    (name) => environment[name]?.trim(),
  );
  if (exposedServiceValues.length) {
    throw new Error(
      `Server service configuration must not be NEXT_PUBLIC: ${exposedServiceValues.join(', ')}`,
    );
  }

  const missing = REQUIRED_PRODUCTION_VALUES.filter(
    (name) => !environment[name]?.trim(),
  );
  if (missing.length) {
    throw new Error(`Missing production environment: ${missing.join(', ')}`);
  }

  const configured = new Set();
  for (const integration of OPTIONAL_INTEGRATIONS) {
    const names = [...integration.origins, ...integration.values];
    const present = names.filter((name) => environment[name]?.trim());
    if (present.length && present.length !== names.length) {
      const absent = names.filter((name) => !environment[name]?.trim());
      throw new Error(
        `${integration.label} is half configured: set ${absent.join(', ')}, ` +
          `or remove ${present.join(', ')} to run without it`,
      );
    }
    if (present.length) configured.add(integration.label);
  }

  const trustedHostnames = parseTrustedHttpsHostnames(
    environment.TRUSTED_HTTPS_HOSTNAMES,
  );
  const trustedUpstreamHostnames = parseTrustedHttpsHostnames(
    environment.TRUSTED_UPSTREAM_HOSTS,
  );
  const origins = {};

  // Collected rather than thrown one at a time: each rejected origin used to
  // cost a whole build to discover, so a deployment with three of them took
  // three builds to learn three facts it could have reported at once.
  const originProblems = [];

  for (const name of [
    ...REQUIRED_PRODUCTION_ORIGINS,
    ...OPTIONAL_HTTPS_ORIGINS,
    ...OPTIONAL_INTEGRATIONS.flatMap((integration) => integration.origins),
  ]) {
    const raw = environment[name];
    if (!raw?.trim()) continue;
    const protocol = name === 'NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN' ? 'wss:' : 'https:';
    try {
      origins[name] = validateOrigin(name, raw, protocol, trustedHostnames);
    } catch (error) {
      originProblems.push(error.message);
    }
  }

  for (const name of ['AUTH_API_URL', 'SYNC_API_URL', 'TOURNAMENTS_API_URL']) {
    if (
      origins[name] &&
      !trustedUpstreamHostnames.has(new URL(origins[name]).hostname)
    ) {
      originProblems.push(`${name} hostname is not in TRUSTED_UPSTREAM_HOSTS`);
    }
  }

  if (originProblems.length) {
    throw new Error(
      `Origin configuration rejected:\n  - ${originProblems.join('\n  - ')}\n\n` +
        describeOriginConfiguration(environment, trustedHostnames, trustedUpstreamHostnames),
    );
  }

  const tournamentWebSocketOrigin = deriveTournamentWebSocketOrigin(
    origins.TOURNAMENTS_API_URL,
  );
  if (origins.NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN !== tournamentWebSocketOrigin) {
    throw new Error(
      'NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN must be the wss:// equivalent of TOURNAMENTS_API_URL',
    );
  }
  if (environment.WEBCAM_RELAY_SECRET.length < 32) {
    throw new Error('WEBCAM_RELAY_SECRET must contain at least 32 characters');
  }

  if (configured.has('Upstash Redis')) {
    const upstashHostname = new URL(origins.UPSTASH_REDIS_REST_URL).hostname;
    const allowedUpstashHostname = environment.UPSTASH_REDIS_ALLOWED_HOSTNAME;
    if (
      allowedUpstashHostname !== allowedUpstashHostname.trim() ||
      allowedUpstashHostname !== allowedUpstashHostname.toLowerCase() ||
      !DNS_HOSTNAME.test(allowedUpstashHostname) ||
      !allowedUpstashHostname.endsWith('.upstash.io') ||
      upstashHostname !== allowedUpstashHostname
    ) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL must exactly match UPSTASH_REDIS_ALLOWED_HOSTNAME',
      );
    }
    const upstashToken = environment.UPSTASH_REDIS_REST_TOKEN;
    if (
      upstashToken !== upstashToken.trim() ||
      upstashToken.length < 32 ||
      upstashToken.length > 2_048 ||
      /[^\x21-\x7e]/.test(upstashToken)
    ) {
      throw new Error('UPSTASH_REDIS_REST_TOKEN has an invalid format');
    }
  }

  if (configured.has('BRX Match')) {
    if (origins.BRX_MATCH_API_URL !== origins.BRX_MATCH_ALLOWED_ORIGIN) {
      throw new Error(
        'BRX_MATCH_API_URL must exactly match BRX_MATCH_ALLOWED_ORIGIN',
      );
    }
    const matchToken = environment.BRX_MATCH_INTERNAL_TOKEN;
    if (
      matchToken !== matchToken.trim() ||
      matchToken.length < 32 ||
      matchToken.length > 512 ||
      /[^\x21-\x7e]/.test(matchToken)
    ) {
      throw new Error('BRX_MATCH_INTERNAL_TOKEN has an invalid format');
    }
    if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(environment.BRX_MATCH_INTERNAL_CALLER)) {
      throw new Error('BRX_MATCH_INTERNAL_CALLER has an invalid format');
    }
    const edgeModelSha256 = environment.BRX_MATCH_EDGE_MODEL_SHA256;
    if (
      edgeModelSha256 !== edgeModelSha256.trim() ||
      !/^[0-9a-f]{64}$/.test(edgeModelSha256)
    ) {
      throw new Error('BRX_MATCH_EDGE_MODEL_SHA256 must pin a lowercase SHA-256 digest');
    }
  }
  if (
    environment.ENABLE_EPHEMERAL_DECK_MUTATIONS === 'true' ||
    environment.ENABLE_EPHEMERAL_INVENTORY_MUTATIONS === 'true'
  ) {
    throw new Error('Ephemeral persistence flags are forbidden in production');
  }

  return {
    origins: Object.freeze(origins),
    tournamentWebSocketOrigin,
  };
}
