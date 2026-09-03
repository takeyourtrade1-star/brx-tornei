import 'server-only';

import { cookies } from 'next/headers';
import { DEFAULT_PLAYMAT_ID, isPlaymatId, type PlaymatId } from '@/lib/playmats';

export const PLAYMAT_PREFERENCE_COOKIE = 'ebartex_tournament_playmat';
export const PLAYMAT_HOME_BACKGROUND_COOKIE = 'ebartex_tournament_playmat_home';

export async function getDefaultPlaymatId(): Promise<PlaymatId> {
  const value = (await cookies()).get(PLAYMAT_PREFERENCE_COOKIE)?.value;
  return value && isPlaymatId(value) ? value : DEFAULT_PLAYMAT_ID;
}

export async function isHomePlaymatBackgroundEnabled(): Promise<boolean> {
  return (await cookies()).get(PLAYMAT_HOME_BACKGROUND_COOKIE)?.value === '1';
}

export async function getHomePlaymatId(): Promise<PlaymatId | null> {
  const cookieStore = await cookies();
  if (cookieStore.get(PLAYMAT_HOME_BACKGROUND_COOKIE)?.value !== '1') return null;

  const value = cookieStore.get(PLAYMAT_PREFERENCE_COOKIE)?.value;
  return value && isPlaymatId(value) ? value : DEFAULT_PLAYMAT_ID;
}
