import type { BestOf, BuyIn, Participant, Tournament, TournamentStatus } from '@/types/tournament';
import type { FormatId, ModeId } from '@/lib/data/catalog';

const VALID_STATUS: TournamentStatus[] = ['in_registrazione', 'iniziata', 'terminata'];
const VALID_BEST_OF: BestOf[] = ['BO1', 'BO3', 'BO5'];
const VALID_BUY_IN: BuyIn[] = ['for_fun', 'micro', 'low', 'mid', 'high'];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

function pickBool(obj: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'boolean') return v;
  }
  return undefined;
}

function mapParticipant(raw: unknown): Participant | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = pickString(obj, 'id', 'user_id');
  const username = pickString(obj, 'username', 'name');
  if (!id || !username) return null;
  return { id, username, ready: pickBool(obj, 'ready', 'is_ready') ?? false };
}

function mapParticipants(raw: unknown): Participant[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapParticipant).filter((p): p is Participant => p !== null);
}

function mapStatus(raw: unknown): TournamentStatus {
  if (typeof raw === 'string' && VALID_STATUS.includes(raw as TournamentStatus)) {
    return raw as TournamentStatus;
  }
  return 'in_registrazione';
}

function mapBestOf(raw: unknown): BestOf {
  if (typeof raw === 'string' && VALID_BEST_OF.includes(raw as BestOf)) {
    return raw as BestOf;
  }
  return 'BO3';
}

function mapBuyIn(raw: unknown): BuyIn {
  if (typeof raw === 'string' && VALID_BUY_IN.includes(raw as BuyIn)) {
    return raw as BuyIn;
  }
  return 'for_fun';
}

/** Unwrap difensivo: `{ data: T }` oppure payload diretto. */
export function unwrapApiPayload<T>(payload: unknown): T | null {
  const top = asRecord(payload);
  if (!top) return null;
  const inner = top.data;
  if (inner !== undefined && inner !== null) return inner as T;
  return payload as T;
}

/** Mappa un oggetto torneo dall'API (snake_case o camelCase) al tipo frontend. */
export function mapTournamentFromApi(raw: unknown): Tournament | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const id = pickString(obj, 'id');
  const format = pickString(obj, 'format') as FormatId | undefined;
  const mode = pickString(obj, 'mode') as ModeId | undefined;
  const createdAt = pickString(obj, 'created_at', 'createdAt');
  if (!id || !format || !mode || !createdAt) return null;

  const match = asRecord(obj.match);
  const matchId = pickString(obj, 'match_id', 'matchId') ?? pickString(match ?? {}, 'id');
  const matchWebcamSessionId =
    pickString(obj, 'match_webcam_session_id', 'matchWebcamSessionId') ??
    pickString(match ?? {}, 'webcam_session_id', 'webcamSessionId');

  return {
    id,
    format,
    mode,
    buyIn: mapBuyIn(obj.buy_in ?? obj.buyIn),
    bestOf: mapBestOf(obj.best_of ?? obj.bestOf),
    status: mapStatus(obj.status),
    maxPlayers: typeof obj.max_players === 'number' ? obj.max_players : (obj.maxPlayers as number) ?? 2,
    participants: mapParticipants(obj.participants),
    createdAt,
    isPrivate: pickBool(obj, 'is_private', 'isPrivate'),
    webcamSessionId: pickString(obj, 'webcam_session_id', 'webcamSessionId'),
    matchId,
    matchWebcamSessionId,
    createdById: pickString(obj, 'created_by', 'createdBy', 'created_by_id', 'createdById'),
  };
}

export function mapTournamentListFromApi(payload: unknown): Tournament[] {
  const data = unwrapApiPayload<unknown>(payload);
  const list = Array.isArray(data) ? data : Array.isArray(payload) ? payload : [];
  return list.map(mapTournamentFromApi).filter((t): t is Tournament => t !== null);
}

export function mapTournamentFromApiPayload(payload: unknown): Tournament | null {
  const data = unwrapApiPayload<unknown>(payload);
  return mapTournamentFromApi(data ?? payload);
}
