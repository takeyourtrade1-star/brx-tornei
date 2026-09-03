import 'server-only';

import { config } from '@/lib/config';
import {
  extractApiError,
  tournamentFetch,
  TournamentApiError,
} from '@/lib/data/tournament-api-client';
import { unwrapApiPayload } from '@/lib/data/tournament-mapper';
import type { SocialPreferencesData } from '@/types/social';

function mapSocialPreferences(raw: unknown): SocialPreferencesData | null {
  const data = unwrapApiPayload<unknown>(raw);
  if (!data || typeof data !== 'object') return null;
  const value = data as Record<string, unknown>;
  const dndUntil = 'dnd_until' in value ? value.dnd_until : value.dndUntil;
  const showEbartexProfile =
    value.show_ebartex_profile ?? value.showEbartexProfile;
  if (
    (dndUntil !== null &&
      (typeof dndUntil !== 'number' || !Number.isFinite(dndUntil))) ||
    typeof showEbartexProfile !== 'boolean'
  ) {
    return null;
  }
  return { dndUntil, showEbartexProfile };
}

async function requestSocialPreferences(
  init?: RequestInit,
): Promise<SocialPreferencesData> {
  const { ok, status, body } = await tournamentFetch(
    '/api/v1/players/me/social-preferences',
    init,
  );
  if (!ok) {
    throw extractApiError(
      body,
      status,
      'Impossibile aggiornare le preferenze social',
    );
  }
  const preferences = mapSocialPreferences(body);
  if (!preferences) {
    throw new TournamentApiError(
      'Risposta preferenze social non valida',
      502,
      'INVALID_RESPONSE',
    );
  }
  return preferences;
}

export function fetchSocialPreferences(): Promise<SocialPreferencesData> {
  return requestSocialPreferences();
}

export function updateSocialDnd(
  active: boolean,
  durationMinutes: 60,
  ebartexUsername?: string | null,
): Promise<SocialPreferencesData> {
  const username = trustedEbartexUsername(ebartexUsername);
  return requestSocialPreferences({
    method: 'PATCH',
    body: JSON.stringify({
      dnd_active: active,
      dnd_duration_minutes: durationMinutes,
      ...(username ? { ebartex_username: username } : {}),
    }),
  });
}

export function updateSocialEbartexVisibility(
  visible: boolean,
  ebartexUsername?: string | null,
): Promise<SocialPreferencesData> {
  const username = trustedEbartexUsername(ebartexUsername);
  return requestSocialPreferences({
    method: 'PATCH',
    body: JSON.stringify({
      show_ebartex_profile: visible,
      ...(username ? { ebartex_username: username } : {}),
    }),
  });
}

function trustedEbartexUsername(value?: string | null): string | undefined {
  if (!config.api.tournamentsServiceToken) return undefined;
  const username = value?.trim();
  return username && /^[a-zA-Z0-9_]{3,20}$/.test(username)
    ? username
    : undefined;
}

export { mapSocialPreferences };
