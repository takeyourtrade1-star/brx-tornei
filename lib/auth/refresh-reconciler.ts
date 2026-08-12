import { hasUncertainAuthRefreshAttempt } from '@/lib/auth/refresh-attempt-guard';
import { hasUsableAuthSession } from '@/lib/auth/refresh-client';

export type AuthRefreshReconcileOutcome =
  | 'absent'
  | 'cleared'
  | 'retained'
  | 'already-checked';

/** Builds one reconciler per mounted shell, bounded to one check per pathname. */
export function createAuthRefreshReconciler(
  request: typeof fetch = fetch,
): (pathname: string) => Promise<AuthRefreshReconcileOutcome> {
  let lastCheckedPath: string | null = null;
  return async (pathname) => {
    if (!hasUncertainAuthRefreshAttempt()) return 'absent';
    if (lastCheckedPath === pathname) return 'already-checked';
    lastCheckedPath = pathname;
    return await hasUsableAuthSession(request) ? 'cleared' : 'retained';
  };
}
