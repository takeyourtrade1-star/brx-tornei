'use server';

import { getSession } from '@/lib/auth/session';
import { fetchMyGamertag } from '@/lib/data/player-api-client';
import { canUseSocialMockForError } from '@/lib/data/social-fallback-policy';
import {
  getPlayerDndUntil,
  isEbartexProfileVisible,
  setEbartexProfileVisible,
  setPlayerDnd,
} from '@/lib/data/social-mock-store';
import {
  fetchSocialPreferences,
  updateSocialDnd,
  updateSocialEbartexVisibility,
} from '@/lib/data/social-preferences-client';
import {
  socialDndPreferenceSchema,
  socialVisibilityPreferenceSchema,
} from '@/lib/validations/social';
import type { SocialActionState, SocialPreferencesData } from '@/types/social';

async function mockPreferenceGamertag(): Promise<SocialActionState<string>> {
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

function actionError(error: unknown, fallback: string): SocialActionState<never> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : fallback,
  };
}

export async function getSocialPreferencesAction(): Promise<
  SocialActionState<SocialPreferencesData>
> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };
  try {
    return { ok: true, data: await fetchSocialPreferences() };
  } catch (error) {
    if (!canUseSocialMockForError(error)) {
      return actionError(error, 'Preferenze social non disponibili.');
    }
    const identity = await mockPreferenceGamertag();
    return identity.ok && identity.data
      ? { ok: true, data: currentPreferences(identity.data) }
      : { ok: false, error: identity.error };
  }
}

export async function setSocialDndAction(
  input: unknown,
): Promise<SocialActionState<SocialPreferencesData>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };
  const parsed = socialDndPreferenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Preferenza non valida.' };

  try {
    return {
      ok: true,
      data: await updateSocialDnd(
        parsed.data.active,
        parsed.data.durationMinutes,
        session.user.username,
      ),
    };
  } catch (error) {
    if (!canUseSocialMockForError(error)) {
      return actionError(error, 'Impossibile aggiornare lo stato.');
    }
    const identity = await mockPreferenceGamertag();
    if (!identity.ok || !identity.data) return { ok: false, error: identity.error };
    setPlayerDnd(identity.data, parsed.data.active ? parsed.data.durationMinutes : 0);
    return { ok: true, data: currentPreferences(identity.data) };
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
    return {
      ok: true,
      data: await updateSocialEbartexVisibility(
        parsed.data.visible,
        session.user.username,
      ),
    };
  } catch (error) {
    if (!canUseSocialMockForError(error)) {
      return actionError(error, 'Impossibile aggiornare la visibilità.');
    }
    const identity = await mockPreferenceGamertag();
    if (!identity.ok || !identity.data) return { ok: false, error: identity.error };
    setEbartexProfileVisible(identity.data, parsed.data.visible);
    return { ok: true, data: currentPreferences(identity.data) };
  }
}
