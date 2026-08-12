import {
  withGapUploadLock,
  type GapUploadLockResult,
} from '@/lib/gap-recording/upload-lease';

export const AUTH_REFRESH_LOCK_KEY = 'global-auth-refresh';

export type AuthRefreshLock = <T>(
  key: string,
  work: (signal: AbortSignal) => Promise<T>,
) => Promise<GapUploadLockResult<T>>;

/** Unico namespace di coordinamento per ogni rotazione del refresh cookie. */
export function withAuthRefreshLock<T>(
  work: (signal: AbortSignal) => Promise<T>,
  lock: AuthRefreshLock = withGapUploadLock,
): Promise<GapUploadLockResult<T>> {
  return lock(AUTH_REFRESH_LOCK_KEY, work);
}
