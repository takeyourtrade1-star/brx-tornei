import 'server-only';

import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth/session';
import {
  mapTournamentFromApiPayload,
  mapTournamentListFromApi,
  unwrapApiPayload,
} from '@/lib/data/tournament-mapper';
import type { Tournament, JoinTournamentResult } from '@/types/tournament';
import type { Selection } from '@/lib/validations/selection';
import type { CreateTournamentInput } from '@/lib/validations/tournament';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';

const MAX_TOURNAMENT_RESPONSE_BYTES = 512 * 1024;

export class TournamentApiError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'TournamentApiError';
    this.status = status;
    this.code = code;
  }
}

function tournamentsApiConfigured(): boolean {
  return Boolean(config.api.tournamentsBaseURL);
}

export function extractApiError(body: unknown, status: number, fallback: string): TournamentApiError {
  const top = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const detail = top.detail;
  if (detail && typeof detail === 'object') {
    const d = detail as Record<string, unknown>;
    const message =
      (typeof d.message === 'string' && d.message) ||
      (typeof d.detail === 'string' && d.detail) ||
      fallback;
    const code = typeof d.code === 'string' ? d.code : undefined;
    return new TournamentApiError(message, status, code);
  }
  if (typeof detail === 'string' && detail) {
    return new TournamentApiError(detail, status);
  }
  const message =
    (typeof top.message === 'string' && top.message) ||
    (typeof top.error === 'string' && top.error) ||
    fallback;
  const code = typeof top.code === 'string' ? top.code : undefined;
  return new TournamentApiError(message, status, code);
}

export async function tournamentFetch(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const base = config.api.tournamentsBaseURL;
  if (!base) {
    throw new TournamentApiError('Tournament API non configurata', 503, 'API_NOT_CONFIGURED');
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new TournamentApiError('Sessione non valida', 401, 'UNAUTHORIZED');
  }

  if (!path.startsWith('/api/v1/')) {
    throw new TournamentApiError('Percorso Tournament API non valido', 500, 'INVALID_PATH');
  }
  const url = new URL(path, base).toString();
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Accept-Encoding': 'identity',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
      cache: 'no-store',
      redirect: 'error',
      signal: init.signal ?? AbortSignal.timeout(config.api.timeout),
    });

    const body = await readBoundedResponseJson(
      res,
      MAX_TOURNAMENT_RESPONSE_BYTES,
    ).catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Il Tournament Service non risponde (timeout).'
        : 'Impossibile contattare il Tournament Service.';
    throw new TournamentApiError(message, 503, 'API_UNAVAILABLE');
  }
}

function mapJoinResult(payload: unknown): JoinTournamentResult {
  const data = unwrapApiPayload<Record<string, unknown>>(payload) ?? {};
  const tournament =
    mapTournamentFromApiPayload(data.tournament ?? data) ??
    mapTournamentFromApiPayload(payload);
  if (!tournament) {
    throw new TournamentApiError('Risposta join non valida', 502, 'INVALID_RESPONSE');
  }

  const match = data.match && typeof data.match === 'object' ? (data.match as Record<string, unknown>) : null;
  const matchId =
    (typeof data.match_id === 'string' && data.match_id) ||
    (typeof data.matchId === 'string' && data.matchId) ||
    (match && typeof match.id === 'string' ? match.id : undefined) ||
    tournament.matchId;
  const matchWebcamSessionId =
    (typeof data.match_webcam_session_id === 'string' && data.match_webcam_session_id) ||
    (typeof data.matchWebcamSessionId === 'string' && data.matchWebcamSessionId) ||
    (match && typeof match.webcam_session_id === 'string' ? match.webcam_session_id : undefined) ||
    tournament.matchWebcamSessionId;

  return {
    tournament: { ...tournament, matchId, matchWebcamSessionId },
    matchId,
    matchWebcamSessionId,
  };
}

export function isTournamentsApiEnabled(): boolean {
  return tournamentsApiConfigured();
}

export async function fetchTournaments(selection: Selection): Promise<Tournament[]> {
  const params = new URLSearchParams({ mode: selection.mode });
  // Formato esplicito o aggregato "Tutti": omettiamo il parametro → l'API
  // torna tutti i tavoli disponibili nella modalità selezionata.
  if (selection.format !== 'all') params.set('format', selection.format);
  const { ok, status, body } = await tournamentFetch(`/api/v1/tournaments?${params}`);
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile caricare i tornei');
  }
  return mapTournamentListFromApi(body);
}

export async function fetchTournamentById(id: string): Promise<Tournament | null> {
  const { ok, status, body } = await tournamentFetch(`/api/v1/tournaments/${encodeURIComponent(id)}`);
  if (status === 404) return null;
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile caricare il torneo');
  }
  return mapTournamentFromApiPayload(body);
}

export async function postCreateTournament(
  input: CreateTournamentInput,
): Promise<Tournament> {
  const { ok, status, body } = await tournamentFetch('/api/v1/tournaments', {
    method: 'POST',
    body: JSON.stringify({
      format: input.format,
      mode: input.mode,
      bestOf: input.bestOf,
      isPrivate: input.isPrivate ?? false,
      withFriend: input.withFriend ?? false,
    }),
  });
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile creare il torneo');
  }
  const tournament = mapTournamentFromApiPayload(body);
  if (!tournament) {
    throw new TournamentApiError('Risposta creazione non valida', 502, 'INVALID_RESPONSE');
  }
  return tournament;
}

export async function postJoinTournament(id: string): Promise<JoinTournamentResult> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/tournaments/${encodeURIComponent(id)}/join`,
    { method: 'POST', body: JSON.stringify({}) },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile partecipare al torneo');
  }
  return mapJoinResult(body);
}

export async function postReadyTournament(
  id: string,
  ready: boolean,
): Promise<JoinTournamentResult> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/tournaments/${encodeURIComponent(id)}/ready`,
    { method: 'POST', body: JSON.stringify({ ready }) },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile aggiornare lo stato pronto');
  }
  return mapJoinResult(body);
}

export async function postLeaveTournament(id: string): Promise<void> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/tournaments/${encodeURIComponent(id)}/leave`,
    { method: 'POST', body: JSON.stringify({}) },
  );
  // 404 = tavolo già rimosso (nessuno rimasto): trattato come uscita riuscita.
  if (!ok && status !== 404) {
    throw extractApiError(body, status, 'Impossibile alzarsi dal tavolo');
  }
}

/** Segnali di presenza P2P per il countdown di abbandono (90s, Requisiti 3+4):
 * identificati dalla webcam_session_id del match, non dal suo id. */
export async function postReportPeerLost(webcamSessionId: string): Promise<void> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/matches/${encodeURIComponent(webcamSessionId)}/report-peer-lost`,
    { method: 'POST', body: JSON.stringify({}) },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile segnalare la disconnessione');
  }
}

export async function postReportPeerAlive(webcamSessionId: string): Promise<void> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/matches/${encodeURIComponent(webcamSessionId)}/report-peer-alive`,
    { method: 'POST', body: JSON.stringify({}) },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile segnalare la riconnessione');
  }
}

/** "Chi ha vinto?" (Requisito 2): dichiarazione simmetrica, prima richiesta o
 * risposta a quella dell'avversario. Identificato dal match id, non dalla
 * webcam_session_id: qui il chiamante ha già il match id nel contratto. */
export async function postDeclareResult(matchId: string, winnerUserId: string): Promise<void> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/matches/${encodeURIComponent(matchId)}/result`,
    { method: 'POST', body: JSON.stringify({ winner_user_id: winnerUserId }) },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile dichiarare il risultato');
  }
}
