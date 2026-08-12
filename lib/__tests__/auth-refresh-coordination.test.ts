import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAuthBridgeFlow } from '@/lib/auth/bridge-client-flow';
import type { AuthRefreshLock } from '@/lib/auth/refresh-lock';
import { clearUncertainAuthRefreshAttempt } from '@/lib/auth/refresh-attempt-guard';

function response(status: number): Promise<Response> {
  return Promise.resolve(new Response(null, { status }));
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

afterEach(clearUncertainAuthRefreshAttempt);

describe('auth refresh coordination', () => {
  it('refreshes once under the shared lock, then consumes the bridge nonce', async () => {
    const request = vi.fn((path: string) => {
      if (path === '/api/auth/me') return response(401);
      if (path === '/api/auth/refresh') return response(200);
      if (path === '/api/auth/bridge/consume') return response(200);
      throw new Error(`unexpected ${path}`);
    });
    const { lock, spy: lockSpy } = acquiredLock();

    await expect(runAuthBridgeFlow('a'.repeat(32), {
      request: request as typeof fetch,
      lock,
      maxLockAttempts: 1,
    })).resolves.toBe('next');

    expect(lockSpy).toHaveBeenCalledWith('global-auth-refresh', expect.any(Function));
    expect(request.mock.calls.map(([path]) => path)).toEqual([
      '/api/auth/me',
      '/api/auth/me',
      '/api/auth/refresh',
      '/api/auth/bridge/consume',
    ]);
  });

  it('does not rotate when another tab restored the session before lock acquisition', async () => {
    const request = vi.fn()
      .mockImplementationOnce(() => response(401))
      .mockImplementationOnce(() => response(200))
      .mockImplementationOnce(() => response(200));

    await expect(runAuthBridgeFlow('b'.repeat(32), {
      request: request as typeof fetch,
      lock: acquiredLock().lock,
      maxLockAttempts: 1,
    })).resolves.toBe('next');

    expect(request.mock.calls.map(([path]) => path)).toEqual([
      '/api/auth/me',
      '/api/auth/me',
      '/api/auth/bridge/consume',
    ]);
  });

  it('does not consume the nonce or loop after a rejected refresh', async () => {
    const request = vi.fn((path: string) =>
      response(path === '/api/auth/refresh' ? 401 : 401));

    await expect(runAuthBridgeFlow('c'.repeat(32), {
      request: request as typeof fetch,
      lock: acquiredLock().lock,
      maxLockAttempts: 1,
    })).resolves.toBe('login');

    expect(request.mock.calls.map(([path]) => path)).toEqual([
      '/api/auth/me',
      '/api/auth/me',
      '/api/auth/refresh',
    ]);
  });

  it('bounds retries when the cross-tab lock stays unavailable', async () => {
    const request = vi.fn(() => response(401));
    const lockSpy = vi.fn(async () => ({ acquired: false }));
    const wait = vi.fn(async () => {});

    await expect(runAuthBridgeFlow('d'.repeat(32), {
      request: request as typeof fetch,
      lock: lockSpy as unknown as AuthRefreshLock,
      wait,
      maxLockAttempts: 2,
    })).resolves.toBe('login');

    expect(lockSpy).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(3);
  });
});
