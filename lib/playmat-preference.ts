import 'server-only';

import { cookies } from 'next/headers';
import { DEFAULT_PLAYMAT_ID, isPlaymatId, type PlaymatId } from '@/lib/playmats';

export const PLAYMAT_PREFERENCE_COOKIE = 'ebartex_tournament_playmat';

export async function getDefaultPlaymatId(): Promise<PlaymatId> {
  const value = (await cookies()).get(PLAYMAT_PREFERENCE_COOKIE)?.value;
  return value && isPlaymatId(value) ? value : DEFAULT_PLAYMAT_ID;
}
