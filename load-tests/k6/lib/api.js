import http from 'k6/http';
import { check, fail } from 'k6';
import encoding from 'k6/encoding';
import {
  assertRemoteConfirmation,
  AUTH_URL,
  BACKEND_URL,
  BROWSER_ORIGIN,
  FRONTEND_URL,
} from '../config.js';
import { recordHttp } from './metrics.js';

const TOKEN_FIELD = /(\"(?:access[_-]?token|refresh[_-]?token|authorization|token|ticket)\"\s*:\s*)\"(?:\\.|[^\"\\])*\"/gi;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

function redactedDetail(payload) {
  let detail;
  try {
    detail = JSON.stringify(payload);
  } catch {
    return '';
  }
  return detail
    .replace(TOKEN_FIELD, '$1"[redacted]"')
    .replace(/\bBearer\s+[^\s"']+/gi, 'Bearer [redacted]')
    .replace(JWT, '[redacted]')
    .slice(0, 500);
}

function authParams(identity, operation, kind = 'read', expectedStatuses = [200]) {
  return {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${identity.accessToken}`,
      'Accept-Encoding': 'identity',
    },
    redirects: 0,
    tags: { operation, kind },
    responseCallback: http.expectedStatuses(...expectedStatuses),
    timeout: '30s',
  };
}

export function setFrontendSession(identity) {
  const jar = http.cookieJar();
  const secure = FRONTEND_URL.startsWith('https://');
  jar.set(FRONTEND_URL, '__Host-ebartex_access_token', identity.accessToken, {
    path: '/',
    secure,
  });
  if (identity.refreshToken) {
    jar.set(FRONTEND_URL, '__Host-ebartex_refresh_token', identity.refreshToken, {
      path: '/',
      secure,
    });
  }
}

export function json(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export function unwrap(value) {
  if (!value || typeof value !== 'object') return value;
  return value.data && typeof value.data === 'object' ? value.data : value;
}

export function apiRequest(
  identity,
  method,
  path,
  body,
  operation,
  expectedStatuses = [200],
  kind = 'read',
) {
  const params = authParams(identity, operation, kind, expectedStatuses);
  if (body !== undefined) params.headers['Content-Type'] = 'application/json';
  const response = http.request(
    method,
    `${BACKEND_URL}${path}`,
    body === undefined ? null : JSON.stringify(body),
    params,
  );
  const ok = recordHttp(response, operation, expectedStatuses, kind);
  check(response, { [`${operation}: status atteso`]: () => ok }, { operation });
  return response;
}

/** Richiesta browser-like al BFF: autenticazione solo via cookie, mai bearer. */
export function frontendRequest(
  identity,
  method,
  path,
  body,
  operation,
  expectedStatuses = [200],
  kind = 'read',
) {
  setFrontendSession(identity);
  const upperMethod = method.toUpperCase();
  const headers = {
    Accept: 'application/json',
    'Accept-Encoding': 'identity',
    ...(upperMethod !== 'GET' ? { Origin: BROWSER_ORIGIN } : {}),
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = http.request(
    upperMethod,
    `${FRONTEND_URL}${path}`,
    body === undefined ? null : JSON.stringify(body),
    {
      headers,
      redirects: 0,
      tags: { operation, kind },
      responseCallback: http.expectedStatuses(...expectedStatuses),
      timeout: '30s',
    },
  );
  const ok = recordHttp(response, operation, expectedStatuses, kind);
  check(response, { [`${operation}: status atteso`]: () => ok }, { operation });
  return response;
}

export function requireOk(response, operation, expectedStatuses = [200]) {
  if (expectedStatuses.includes(response.status)) return response;
  const payload = json(response);
  const detail = payload && typeof payload === 'object' ? redactedDetail(payload) : '';
  fail(`${operation} fallita: HTTP ${response.status} ${detail}`);
}

export function tokenExpiresAt(accessToken) {
  try {
    if (typeof accessToken !== 'string') return 0;
    const parts = accessToken.split('.');
    if (parts.length !== 3 || !parts[1]) return 0;
    const payload = JSON.parse(encoding.b64decode(parts[1], 'rawurl', 's'));
    const expiresAt = Number(payload && payload.exp);
    return Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : 0;
  } catch {
    return 0;
  }
}

export function refreshIdentity(identity, minimumLifetimeSeconds = 90) {
  if (!Number.isFinite(minimumLifetimeSeconds) || minimumLifetimeSeconds < 0) {
    fail('minimumLifetimeSeconds non valido');
  }
  const expiresAt = Number(identity && identity.expiresAt);
  if (Number.isFinite(expiresAt) && expiresAt > Date.now() / 1000 + minimumLifetimeSeconds) {
    return identity;
  }
  if (!identity || typeof identity.refreshToken !== 'string' || !identity.refreshToken) {
    const label = identity && typeof identity.label === 'string' ? identity.label : 'identita';
    fail(`Token in scadenza per ${label} e refreshToken assente`);
  }
  assertRemoteConfirmation(AUTH_URL);
  const response = http.post(
    `${AUTH_URL}/api/auth/refresh`,
    JSON.stringify({ refresh_token: identity.refreshToken }),
    {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      redirects: 0,
      tags: { operation: 'auth_refresh', kind: 'auth' },
      responseCallback: http.expectedStatuses(200),
      timeout: '30s',
    },
  );
  recordHttp(response, 'auth_refresh', [200], 'mutation');
  requireOk(response, 'auth_refresh');
  const payload = unwrap(json(response)) || {};
  const accessToken = payload.access_token || payload.accessToken;
  const refreshToken = payload.refresh_token || payload.refreshToken;
  if (typeof accessToken !== 'string') fail('auth_refresh: access_token mancante');
  if (typeof refreshToken !== 'string' || !refreshToken) {
    fail('auth_refresh: refresh_token mancante');
  }
  const nextExpiresAt = tokenExpiresAt(accessToken);
  if (!nextExpiresAt) fail('auth_refresh: access_token non valido');
  return {
    ...identity,
    accessToken,
    refreshToken,
    expiresAt: nextExpiresAt,
  };
}

export function extractTournament(response) {
  const payload = unwrap(json(response));
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const tournament = payload.tournament || payload;
  return tournament && typeof tournament === 'object' && !Array.isArray(tournament)
    ? tournament
    : null;
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value) || null;
}

export function extractMatch(response) {
  const payload = unwrap(json(response));
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const tournament = payload.tournament && typeof payload.tournament === 'object'
    ? payload.tournament
    : payload;
  const nestedMatch = payload.match && typeof payload.match === 'object'
    ? payload.match
    : tournament.match && typeof tournament.match === 'object'
      ? tournament.match
      : {};
  return {
    matchId: firstString(
      payload.match_id,
      payload.matchId,
      tournament.match_id,
      tournament.matchId,
      nestedMatch.id,
      nestedMatch.match_id,
      nestedMatch.matchId,
    ),
    sessionId: firstString(
      payload.match_webcam_session_id,
      payload.matchWebcamSessionId,
      payload.webcam_session_id,
      payload.webcamSessionId,
      tournament.match_webcam_session_id,
      tournament.matchWebcamSessionId,
      tournament.webcam_session_id,
      tournament.webcamSessionId,
      nestedMatch.webcam_session_id,
      nestedMatch.webcamSessionId,
    ),
  };
}
