import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchGapUploadWithAuthRecovery } from '@/lib/gap-recording/upload-auth-recovery';
import type { AuthRefreshLock } from '@/lib/auth/refresh-lock';
import { runAuthBridgeFlow } from '@/lib/auth/bridge-client-flow';
import {
  clearUncertainAuthRefreshAttempt,
  hasUncertainAuthRefreshAttempt,
  markAuthRefreshAttemptUncertain,
} from '@/lib/auth/refresh-attempt-guard';

let stored = new Map<string, string>();

function fakeStorage(): Storage {
  return {
    get length() { return stored.size; },
    clear: () => stored.clear(),
    getItem: (key) => stored.get(key) ?? null,
    key: (index) => [...stored.keys()][index] ?? null,
    removeItem: (key) => { stored.delete(key); },
    setItem: (key, value) => { stored.set(key, value); },
  };
}

function acquiredLock() {
  const spy = vi.fn(async (
    _key: string,
    work: (signal: AbortSignal) => Promise<unknown>,
  ) => ({
    acquired: true,
    value: await work(new AbortController().signal),
  }));
  return { lock: spy as unknown as AuthRefreshLock, spy };
}

beforeEach(() => {
  stored = new Map();
  vi.stubGlobal('localStorage', fakeStorage());
  clearUncertainAuthRefreshAttempt();
});

afterEach(() => {
  clearUncertainAuthRefreshAttempt();
  vi.unstubAllGlobals();
});

describe('gap upload auth recovery', () => {
  it('refreshes under the global lock and replays once', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const refresh = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { lock, spy: lockSpy } = acquiredLock();
    vi.stubGlobal('fetch', refresh);

    const response = await fetchGapUploadWithAuthRecovery(request, lock);

    expect(response.status).toBe(200);
    expect(request).toHaveBeenCalledTimes(2);
    expect(lockSpy).toHaveBeenCalledTimes(1);
    expect(lockSpy.mock.calls[0][0]).toBe('global-auth-refresh');
    expect(refresh).toHaveBeenNthCalledWith(2, '/api/auth/refresh', expect.objectContaining({
      method: 'POST',
      body: '{}',
      credentials: 'same-origin',
    }));
    expect(hasUncertainAuthRefreshAttempt()).toBe(false);
  });

  it('does not loop when the single replay is still unauthorized', async () => {
    const request = vi.fn(async () => new Response(null, { status: 401 }));
    const refresh = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', refresh);

    const response = await fetchGapUploadWithAuthRecovery(request, acquiredLock().lock);

    expect(response.status).toBe(401);
    expect(request).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('leaves the first 401 retryable when the cross-tab lock is unavailable', async () => {
    const first = new Response(null, { status: 401 });
    const request = vi.fn(async () => first);
    const lock = vi.fn(async () => ({ acquired: false }));
    const refresh = vi.fn();
    vi.stubGlobal('fetch', refresh);

    const response = await fetchGapUploadWithAuthRecovery(
      request,
      lock as unknown as AuthRefreshLock,
    );

    expect(response).toBe(first);
    expect(request).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('does not replay after a rejected refresh', async () => {
    const first = new Response(null, { status: 401 });
    const request = vi.fn(async () => first);
    const refresh = vi.fn(async () => new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', refresh);

    const response = await fetchGapUploadWithAuthRecovery(request, acquiredLock().lock);

    expect(response).toBe(first);
    expect(request).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('skips rotation when another tab restored the session under the lock', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const auth = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', auth);

    const response = await fetchGapUploadWithAuthRecovery(request, acquiredLock().lock);

    expect(response.status).toBe(200);
    expect(auth).toHaveBeenCalledTimes(1);
    expect(auth).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
      credentials: 'same-origin',
    }));
  });

  it('persists an ambiguous response and never reuses that refresh cookie', async () => {
    const request = vi.fn(async () => new Response(null, { status: 401 }));
    const auth = vi.fn(async (path: string | URL | Request) => {
      if (path === '/api/auth/me') return new Response(null, { status: 401 });
      throw new TypeError('response lost after request');
    });
    vi.stubGlobal('fetch', auth);

    await fetchGapUploadWithAuthRecovery(request, acquiredLock().lock);
    await fetchGapUploadWithAuthRecovery(request, acquiredLock().lock);

    expect(auth.mock.calls.filter(([path]) => path === '/api/auth/refresh')).toHaveLength(1);
    expect(hasUncertainAuthRefreshAttempt()).toBe(true);
    expect([...stored.values()]).toEqual(['uncertain']);
    expect(JSON.stringify([...stored.entries()])).not.toContain('refresh-token');
  });

  it('shares the ambiguous-attempt marker between uploader and auth bridge', async () => {
    const upload = vi.fn(async () => new Response(null, { status: 401 }));
    const auth = vi.fn(async (path: string | URL | Request) => {
      if (path === '/api/auth/me') return new Response(null, { status: 401 });
      throw new TypeError('ambiguous refresh');
    });
    vi.stubGlobal('fetch', auth);
    await fetchGapUploadWithAuthRecovery(upload, acquiredLock().lock);

    const bridgeRequest = vi.fn(async (_path: string | URL | Request) =>
      new Response(null, { status: 401 }));
    await expect(runAuthBridgeFlow('e'.repeat(32), {
      request: bridgeRequest as typeof fetch,
      lock: acquiredLock().lock,
      maxLockAttempts: 1,
    })).resolves.toBe('login');

    expect(bridgeRequest.mock.calls.some(([path]) => path === '/api/auth/refresh')).toBe(false);
  });

  it('clears an old marker when me proves that the current session is valid', async () => {
    markAuthRefreshAttemptUncertain();
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })));

    await expect(fetchGapUploadWithAuthRecovery(request, acquiredLock().lock))
      .resolves.toHaveProperty('status', 200);

    expect(hasUncertainAuthRefreshAttempt()).toBe(false);
    expect(stored.size).toBe(0);
  });
});
