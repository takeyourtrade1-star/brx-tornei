'use server';

import { getSession } from '@/lib/auth/session';
import { fetchMyGamertag } from '@/lib/data/player-api-client';
import { fetchRecentOpponents } from '@/lib/data/recent-opponents';
import type { RecentOpponent, SocialActionState } from '@/types/social';

export async function getRecentOpponentsAction(): Promise<SocialActionState<RecentOpponent[]>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    const data = await fetchRecentOpponents(myGamertag);
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile caricare i duellanti recenti.';
    return { ok: false, error: message };
  }
}
