import 'server-only';

import { enforceServerRateLimit } from '@/lib/security/server-rate-limit';

export function enforceJoinDeckRateLimit(userId: string): Promise<void> {
  return enforceServerRateLimit({
    scope: 'deck-join',
    subject: userId,
    limit: 30,
    requireDistributedStore: true,
  });
}
