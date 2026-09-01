'use server';

import { getSession } from '@/lib/auth/session';
import { config } from '@/lib/config';
import { fetchMyGamertag } from '@/lib/data/player-api-client';
import {
  getPlayerDndUntil,
  isEbartexProfileVisible,
  setEbartexProfileVisible,
  setPlayerDnd,
} from '@/lib/data/social-mock-store';
import {
  socialDndPreferenceSchema,
  socialVisibilityPreferenceSchema,
} from '@/lib/validations/social';
import type { SocialActionState } from '@/types/social';

interface SocialPreferencesData {
  dndUntil: number | null;
  showEbartexProfile: boolean;
}

async function preferenceGamertag(): Promise<SocialActionState<string>> {
  if (!config.features.ephemeralSocial) {
    return {
      ok: false,
      error: 'Le preferenze social richiedono il salvataggio nel servizio Tornei.',
    };
  }
  const gamertag = await fetchMyGamertag().catch(() => null);
  return gamertag
    ? { ok: true, data: gamertag }
    : { ok: false, error: 'Imposta un gamertag prima di modificare le preferenze.' };
}

function currentPreferences(gamertag: string): SocialPreferencesData {
  return {
    dndUntil: getPlayerDndUntil(gamertag),
    showEbartexProfile: isEbartexProfileVisible(gamertag),
  };
}

export async function getSocialPreferencesAction(): Promise<
  SocialActionState<SocialPreferencesData>
> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };
  const identity = await preferenceGamertag();
  return identity.ok && identity.data
    ? { ok: true, data: currentPreferences(identity.data) }
    : { ok: false, error: identity.error };
}

export async function setSocialDndAction(
  input: unknown,
): Promise<SocialActionState<SocialPreferencesData>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };
  const parsed = socialDndPreferenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Preferenza non valida.' };

  try {
    const identity = await preferenceGamertag();
    if (!identity.ok || !identity.data) return { ok: false, error: identity.error };
    setPlayerDnd(identity.data, parsed.data.active ? parsed.data.durationMinutes : 0);
    return { ok: true, data: currentPreferences(identity.data) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Impossibile aggiornare lo stato.',
    };
  }
}

export async function setSocialEbartexVisibilityAction(
  input: unknown,
): Promise<SocialActionState<SocialPreferencesData>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };
  const parsed = socialVisibilityPreferenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Preferenza non valida.' };

  try {
    const identity = await preferenceGamertag();
    if (!identity.ok || !identity.data) return { ok: false, error: identity.error };
    setEbartexProfileVisible(identity.data, parsed.data.visible);
    return { ok: true, data: currentPreferences(identity.data) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error
        ? error.message
        : 'Impossibile aggiornare la visibilità.',
    };
  }
}
