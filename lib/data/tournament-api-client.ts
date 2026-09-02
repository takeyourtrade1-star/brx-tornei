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
import type { ConnectionQualityInput } from '@/lib/validations/connection-quality';
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
  const method = (init.method ?? 'GET').toUpperCase();
  // Le letture alimentano direttamente gli RSC: un singolo reset di rete o un
  // 5xx durante un rolling deploy non deve trasformarsi nella pagina generica
  // "Application error". Ritentiamo soltanto i GET, quindi mai le mutazioni.
  const attempts = method === 'GET' ? 2 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
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
      if ((res.status === 429 || res.status >= 500) && attempt + 1 < attempts) {
        if (res.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        continue;
      }
      return { ok: res.ok, status: res.status, body };
    } catch (err) {
      if (attempt + 1 < attempts) continue;
      const message =
        err instanceof Error && err.name === 'TimeoutError'
          ? 'Il Tournament Service non risponde (timeout).'
          : 'Impossibile contattare il Tournament Service.';
      throw new TournamentApiError(message, 503, 'API_UNAVAILABLE');
    }
  }

  // Il ciclo termina sempre con un return o un throw; fallback per TypeScript.
  throw new TournamentApiError(
    'Impossibile contattare il Tournament Service.',
    503,
    'API_UNAVAILABLE',
  );
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

export async function postJoinTournament(
  id: string,
  deckId?: string,
): Promise<JoinTournamentResult> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/tournaments/${encodeURIComponent(id)}/join`,
    { method: 'POST', body: JSON.stringify({ deckId: deckId || null }) },
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

/** Segnali locali di instabilità P2P con TTL: non assegnano risultati.
 * Sono identificati dalla webcam_session_id del match, non dal suo id. */
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

export async function postConnectionQuality(
  webcamSessionId: string,
  sample: ConnectionQualityInput,
): Promise<void> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/matches/${encodeURIComponent(webcamSessionId)}/connection-quality`,
    {
      method: 'POST',
      body: JSON.stringify({
        quality: sample.level,
        rtt_ms: sample.rttMs,
        packet_loss_pct: sample.packetLossPct,
        jitter_ms: sample.jitterMs,
        transport: sample.transport,
      }),
    },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile registrare la qualità della connessione');
  }
}

/** "Chi ha vinto?": proposta simmetrica; solo due scelte concordi chiudono.
 * È identificata dal match id, non dalla webcam_session_id. */
export async function postDeclareResult(
  matchId: string,
  winnerUserId: string,
  winnerScore: number,
  loserScore: number,
): Promise<void> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/matches/${encodeURIComponent(matchId)}/result`,
    {
      method: 'POST',
      body: JSON.stringify({
        winner_user_id: winnerUserId,
        winner_score: winnerScore,
        loser_score: loserScore,
      }),
    },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile dichiarare il risultato');
  }
}
