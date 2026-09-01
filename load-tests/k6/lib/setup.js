import { fail, sleep } from 'k6';
import {
  BACKEND_URL,
  CLEANUP_BEFORE,
  FORMAT,
  MODE,
  PAIR_DELAY_SECONDS,
  SETUP_TOKEN_BUFFER_SECONDS,
} from '../config.js';
import { identities } from './identities.js';
import {
  apiRequest,
  extractMatch,
  extractTournament,
  json,
  refreshIdentity,
  requireOk,
  unwrap,
} from './api.js';
import { lifecycleCompleted } from './metrics.js';
import http from 'k6/http';

function participants(tournament) {
  return Array.isArray(tournament && tournament.participants) ? tournament.participants : [];
}

function participantId(participant) {
  return participant && (participant.user_id || participant.id);
}

function cleanupIdentity(identity) {
  const response = apiRequest(
    identity,
    'GET',
    `/api/v1/tournaments?mode=${MODE}`,
    undefined,
    'preflight_list',
  );
  requireOk(response, 'preflight_list');
  const data = unwrap(json(response));
  const tournaments = Array.isArray(data) ? data : [];
  const mine = tournaments.find((tournament) =>
    participants(tournament).some((participant) => participantId(participant) === identity.userId),
  );
  if (!mine) return;
  const id = mine.id;
  if (!id) fail(`Cleanup senza tournament id per ${identity.label}`);
  const left = apiRequest(
    identity,
    'POST',
    `/api/v1/tournaments/${encodeURIComponent(id)}/leave`,
    {},
    'preflight_leave',
    [200, 404],
    'mutation',
  );
  requireOk(left, 'preflight_leave', [200, 404]);
}

function requireGamertag(identity) {
  const response = apiRequest(
    identity,
    'GET',
    '/api/v1/players/me/profile',
    undefined,
    'preflight_profile',
  );
  requireOk(response, 'preflight_profile');
  const profile = unwrap(json(response));
  if (!profile || typeof profile.gamertag !== 'string' || !profile.gamertag) {
    fail(`${identity.label}: gamertag di test mancante`);
  }
}

function bestEffortLeave(identity, tournamentId) {
  try {
    apiRequest(
      identity,
      'POST',
      `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/leave`,
      {},
      'setup_cleanup_leave',
      [200, 404],
      'mutation',
    );
  } catch {
    // Il fallimento di cleanup non deve nascondere l'errore del lifecycle.
    // Il TTL autorevole del backend rimuove comunque i tavoli pending.
  }
}

function preparePair(rawHost, rawGuest, pairIndex) {
  const host = refreshIdentity(rawHost, 180);
  const guest = refreshIdentity(rawGuest, 180);
  requireGamertag(host);
  requireGamertag(guest);
  if (CLEANUP_BEFORE) {
    cleanupIdentity(host);
    cleanupIdentity(guest);
  }

  let tournamentId = null;
  try {
    const created = apiRequest(
      host,
      'POST',
      '/api/v1/tournaments',
      { format: FORMAT, mode: MODE, bestOf: 'BO3', isPrivate: false, withFriend: true },
      'tournament_create',
      [201],
      'mutation',
    );
    requireOk(created, 'tournament_create', [201]);
    const tournament = extractTournament(created);
    tournamentId = tournament && tournament.id;
    if (!tournamentId) fail(`Pair ${pairIndex + 1}: tournament id mancante`);

    requireOk(
      apiRequest(
        host,
        'POST',
        `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/join`,
        {},
        'host_join',
        [200],
        'mutation',
      ),
      'host_join',
    );
    requireOk(
      apiRequest(
        guest,
        'POST',
        `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/join`,
        {},
        'guest_join',
        [200],
        'mutation',
      ),
      'guest_join',
    );
    requireOk(
      apiRequest(
        host,
        'POST',
        `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/ready`,
        { ready: true },
        'host_ready',
        [200],
        'mutation',
      ),
      'host_ready',
    );
    const started = apiRequest(
      guest,
      'POST',
      `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/ready`,
      { ready: true },
      'guest_ready',
      [200],
      'mutation',
    );
    requireOk(started, 'guest_ready');
    let match = extractMatch(started);
    if (!match.matchId || !match.sessionId) {
      const detail = apiRequest(
        host,
        'GET',
        `/api/v1/tournaments/${encodeURIComponent(tournamentId)}`,
        undefined,
        'started_tournament_read',
      );
      requireOk(detail, 'started_tournament_read');
      match = extractMatch(detail);
    }
    if (!match.matchId || !match.sessionId) {
      lifecycleCompleted.add(false);
      fail(`Pair ${pairIndex + 1}: match/sessione non creati`);
    }
    lifecycleCompleted.add(true);
    // Il backend ordina gli UUID per assegnare player_1/host. localeCompare
    // dipende dalla locale del runtime e puo divergere su token maiuscoli.
    const firstIsHost = host.userId.toLowerCase() < guest.userId.toLowerCase();
    const [hostRole, guestRole] = firstIsHost
      ? ['host', 'guest']
      : ['guest', 'host'];
    const shared = {
      tournamentId,
      matchId: match.matchId,
      sessionId: match.sessionId,
      resultWinnerId: host.userId,
    };
    return [
      {
        ...host,
        ...shared,
        pairIndex,
        pairPosition: 0,
        role: hostRole,
        opponentId: guest.userId,
      },
      {
        ...guest,
        ...shared,
        pairIndex,
        pairPosition: 1,
        role: guestRole,
        opponentId: host.userId,
      },
    ];
  } catch (error) {
    if (tournamentId) {
      bestEffortLeave(host, tournamentId);
      bestEffortLeave(guest, tournamentId);
    }
    throw error;
  }
}

export function preparePlayers() {
  const health = http.get(`${BACKEND_URL}/api/tournaments/health`, {
    redirects: 0,
    tags: { operation: 'readiness', kind: 'read' },
    timeout: '10s',
  });
  if (health.status !== 200) fail(`Readiness fallita: HTTP ${health.status}`);

  const players = [];
  for (let index = 0; index < identities.length; index += 2) {
    players.push(...preparePair(identities[index], identities[index + 1], index / 2));
    if (PAIR_DELAY_SECONDS > 0 && index + 2 < identities.length) {
      sleep(PAIR_DELAY_SECONDS);
    }
  }
  // Un solo refresh sequenziale dopo la preparazione evita che gli scenari
  // partano con token quasi scaduti e ruotino la stessa famiglia insieme.
  const freshPlayers = players.map((player) =>
    refreshIdentity(player, SETUP_TOKEN_BUFFER_SECONDS),
  );
  return { players: freshPlayers };
}
