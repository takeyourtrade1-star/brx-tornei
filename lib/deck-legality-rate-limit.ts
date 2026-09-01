import 'server-only';

import { enforceServerRateLimit } from '@/lib/security/server-rate-limit';

export const DECK_LEGALITY_LIMIT_PER_MINUTE = 12;

/** Quota condivisa da Server Action e route HTTP, sempre distribuita in produzione. */
export function enforceDeckLegalityRateLimit(userId: string): Promise<void> {
  return enforceServerRateLimit({
    scope: 'deck-legality',
    subject: userId,
    limit: DECK_LEGALITY_LIMIT_PER_MINUTE,
    requireDistributedStore: true,
  });
}
