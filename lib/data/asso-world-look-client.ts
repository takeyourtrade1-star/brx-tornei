import 'server-only';

import {
  extractApiError,
  TournamentApiError,
  tournamentFetch,
} from '@/lib/data/tournament-api-client';
import { unwrapApiPayload } from '@/lib/data/tournament-mapper';
import {
  DEFAULT_ASSO_WORLD_LOOK,
  serializeAssoWorldLook,
  tryParseAssoWorldLook,
} from '@/lib/asso-world-look';
import type { AssoWorldLook } from '@/types/asso-world';

export const ASSO_WORLD_LOOK_API_PATH = '/api/v1/players/me/asso-world-look';

const LOOK_KEYS = [
  'look',
  'world_look',
  'worldLook',
  'asso_world_look',
  'assoWorldLook',
  'avatar_id',
  'avatarId',
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readEncodedLook(payload: unknown): { found: boolean; value?: unknown } {
  const unwrapped = typeof payload === 'string' ? payload : unwrapApiPayload<unknown>(payload);
  if (typeof unwrapped === 'string') return { found: true, value: unwrapped };

  const record = asRecord(unwrapped);
  if (!record) return { found: false };
  for (const key of LOOK_KEYS) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return { found: true, value: record[key] };
    }
  }
  return { found: false };
}

/** Mappa il payload backend mantenendo compatibilità solo in lettura. */
export function mapAssoWorldLook(payload: unknown): AssoWorldLook | null {
  const encoded = readEncodedLook(payload);
  if (!encoded.found || encoded.value === null || encoded.value === undefined) {
    return DEFAULT_ASSO_WORLD_LOOK;
  }
  return tryParseAssoWorldLook(encoded.value);
}

async function requestAssoWorldLook(init?: RequestInit): Promise<AssoWorldLook> {
  const { ok, status, body } = await tournamentFetch(ASSO_WORLD_LOOK_API_PATH, init);
  if (!ok) {
    throw extractApiError(
      body,
      status,
      init?.method === 'PATCH'
        ? 'Impossibile salvare la personalizzazione Asso World'
        : 'Impossibile leggere la personalizzazione Asso World',
    );
  }

  const look = mapAssoWorldLook(body);
  if (!look) {
    throw new TournamentApiError(
      'Risposta personalizzazione Asso World non valida',
      502,
      'INVALID_RESPONSE',
    );
  }
  return look;
}

export function fetchAssoWorldLook(): Promise<AssoWorldLook> {
  return requestAssoWorldLook();
}

export async function updateAssoWorldLook(look: AssoWorldLook): Promise<AssoWorldLook> {
  return requestAssoWorldLook({
    method: 'PATCH',
    body: JSON.stringify({ look: serializeAssoWorldLook(look) }),
  });
}
