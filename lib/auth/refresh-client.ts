import {
  clearUncertainAuthRefreshAttempt,
  hasUncertainAuthRefreshAttempt,
  markAuthRefreshAttemptUncertain,
} from '@/lib/auth/refresh-attempt-guard';

function requestSignal(signal: AbortSignal | undefined, timeout: number): AbortSignal {
  return signal
    ? AbortSignal.any([signal, AbortSignal.timeout(timeout)])
    : AbortSignal.timeout(timeout);
}

/** A valid access cookie is proof that an earlier uncertain rotation completed. */
export async function hasUsableAuthSession(
  request: typeof fetch,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    const response = await request('/api/auth/me', {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: requestSignal(signal, 15_000),
    });
    if (response.ok) clearUncertainAuthRefreshAttempt();
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Never reuses a refresh cookie after a response that may have been lost.
 * A response that did arrive (any status) leaves no ambiguity: only a thrown
 * network error, timeout or abort keeps the marker, because the backend may
 * have completed the rotation without the browser ever seeing it.
 */
export async function refreshAuthSessionOnce(
  request: typeof fetch,
  signal: AbortSignal,
): Promise<boolean> {
  if (signal.aborted || hasUncertainAuthRefreshAttempt()) return false;
  markAuthRefreshAttemptUncertain();
  try {
    const response = await request('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: requestSignal(signal, 30_000),
    });
    clearUncertainAuthRefreshAttempt();
    return response.ok;
  } catch {
    return false;
  }
}
