import {
  withAuthRefreshLock,
  type AuthRefreshLock,
} from '@/lib/auth/refresh-lock';
import {
  hasUsableAuthSession,
  refreshAuthSessionOnce,
} from '@/lib/auth/refresh-client';

export type AuthBridgeOutcome = 'next' | 'login';

interface AuthBridgeFlowOptions {
  request?: typeof fetch;
  lock?: AuthRefreshLock;
  wait?: (milliseconds: number) => Promise<void>;
  maxLockAttempts?: number;
}

const DEFAULT_LOCK_ATTEMPTS = 6;

async function requestOk(
  request: typeof fetch,
  path: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    const signals = signal
      ? [signal, AbortSignal.timeout(15_000)]
      : [AbortSignal.timeout(15_000)];
    return (await request(path, {
      ...init,
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.any(signals),
    })).ok;
  } catch {
    return false;
  }
}

async function consumeNonce(
  nonce: string,
  request: typeof fetch,
  signal?: AbortSignal,
): Promise<boolean> {
  return requestOk(request, '/api/auth/bridge/consume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce }),
  }, signal);
}

/** Coordina bridge e uploader sullo stesso lock prima di ruotare il refresh cookie. */
export async function runAuthBridgeFlow(
  nonce: string,
  options: AuthBridgeFlowOptions = {},
): Promise<AuthBridgeOutcome> {
  const request = options.request ?? fetch;
  const wait = options.wait ?? ((milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const attempts = Math.max(1, options.maxLockAttempts ?? DEFAULT_LOCK_ATTEMPTS);
  const hasSession = (signal?: AbortSignal) =>
    hasUsableAuthSession(request, signal);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await hasSession()) {
      return await consumeNonce(nonce, request) ? 'next' : 'login';
    }
    try {
      const locked = await withAuthRefreshLock(async (signal) => {
        if (await hasSession(signal)) {
          return await consumeNonce(nonce, request, signal) ? 'next' : 'login';
        }
        const refreshed = await refreshAuthSessionOnce(request, signal);
        if (!refreshed) return 'login';
        return await consumeNonce(nonce, request, signal) ? 'next' : 'login';
      }, options.lock);
      if (locked.acquired) return locked.value ?? 'login';
    } catch {
      // Un lock cross-tab temporaneamente indisponibile segue lo stesso retry limitato.
    }
    if (attempt + 1 < attempts) await wait(500 * 2 ** attempt);
  }

  if (await hasSession()) {
    return await consumeNonce(nonce, request) ? 'next' : 'login';
  }
  return 'login';
}
