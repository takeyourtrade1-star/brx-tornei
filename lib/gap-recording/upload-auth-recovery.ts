import {
  withAuthRefreshLock,
  type AuthRefreshLock,
} from '@/lib/auth/refresh-lock';
import {
  hasUsableAuthSession,
  refreshAuthSessionOnce,
} from '@/lib/auth/refresh-client';

/** Refreshes through the redacting auth BFF, then replays one idempotent upload mutation. */
export async function fetchGapUploadWithAuthRecovery(
  request: () => Promise<Response>,
  lock?: AuthRefreshLock,
): Promise<Response> {
  const first = await request();
  if (first.status !== 401) return first;

  try {
    const refresh = await withAuthRefreshLock(async (signal) =>
      await hasUsableAuthSession(fetch, signal) ||
        refreshAuthSessionOnce(fetch, signal), lock);
    if (!refresh.acquired || !refresh.value) return first;
  } catch {
    return first;
  }
  return request();
}
