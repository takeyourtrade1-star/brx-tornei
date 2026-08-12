import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearUncertainAuthRefreshAttempt,
  hasUncertainAuthRefreshAttempt,
  markAuthRefreshAttemptUncertain,
} from '@/lib/auth/refresh-attempt-guard';
import { createAuthRefreshReconciler } from '@/lib/auth/refresh-reconciler';

const values = new Map<string, string>();

beforeEach(() => {
  values.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => { values.delete(key); },
    setItem: (key: string, value: string) => { values.set(key, value); },
  });
  clearUncertainAuthRefreshAttempt();
});

afterEach(() => {
  clearUncertainAuthRefreshAttempt();
  vi.unstubAllGlobals();
});

describe('auth refresh marker reconciliation', () => {
  it('does not call me when no uncertain attempt exists', async () => {
    const request = vi.fn();

    await expect(createAuthRefreshReconciler(request)('/tornei'))
      .resolves.toBe('absent');
    expect(request).not.toHaveBeenCalled();
  });

  it('retains the marker after 401 and checks once per pathname', async () => {
    markAuthRefreshAttemptUncertain();
    const request = vi.fn(async () => new Response(null, { status: 401 }));
    const reconcile = createAuthRefreshReconciler(request as typeof fetch);

    await expect(reconcile('/login')).resolves.toBe('retained');
    await expect(reconcile('/login')).resolves.toBe('already-checked');

    expect(request).toHaveBeenCalledTimes(1);
    expect(hasUncertainAuthRefreshAttempt()).toBe(true);
  });

  it('clears the marker only when me proves the session is valid', async () => {
    markAuthRefreshAttemptUncertain();
    const request = vi.fn(async () => new Response(null, { status: 200 }));

    await expect(createAuthRefreshReconciler(request as typeof fetch)('/tornei'))
      .resolves.toBe('cleared');

    expect(hasUncertainAuthRefreshAttempt()).toBe(false);
    expect(values.size).toBe(0);
  });
});
