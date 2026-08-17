import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TokenResponse } from '@/types/auth';

const cookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('react', () => ({ cache: <T>(value: T) => value }));
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import {
  getAccessToken,
  getRefreshToken,
  setSessionCookies,
} from '@/lib/auth/session';
import {
  getPreAuthCookie,
  PRE_AUTH_MAX_AGE,
  setPreAuthCookie,
} from '@/lib/auth/pre-auth-cookie';
import { config } from '@/lib/config';

describe('auth cookie token validation', () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
  });

  it('scrive access+refresh insieme e clampa il TTL access', async () => {
    await setSessionCookies({
      access_token: 'access.valid-token',
      refresh_token: 'refresh.valid-token',
      expires_in: Number.MAX_SAFE_INTEGER,
    });

    expect(cookieStore.set).toHaveBeenCalledTimes(2);
    expect(cookieStore.set).toHaveBeenNthCalledWith(
      1,
      config.auth.accessCookie,
      'access.valid-token',
      expect.objectContaining({ maxAge: config.auth.accessMaxAge, httpOnly: true }),
    );
    expect(cookieStore.set).toHaveBeenNthCalledWith(
      2,
      config.auth.refreshCookie,
      'refresh.valid-token',
      expect.objectContaining({ maxAge: config.auth.refreshMaxAge, httpOnly: true }),
    );
  });

  it('usa expires_in quando e piu breve del fallback locale', async () => {
    await setSessionCookies({
      access_token: 'access.short-lived',
      refresh_token: 'refresh.short-lived',
      expires_in: 90,
    });

    expect(cookieStore.set).toHaveBeenNthCalledWith(
      1,
      config.auth.accessCookie,
      'access.short-lived',
      expect.objectContaining({ maxAge: 90, httpOnly: true }),
    );
  });

  it.each([
    { access_token: 'access-only' },
    { access_token: 'access', refresh_token: 'caf\u00e9' },
    { access_token: 'access', refresh_token: `r${'x'.repeat(3_800)}` },
  ])('non muta cookie per una coppia non valida: %j', async (tokens) => {
    await expect(
      setSessionCookies(tokens as unknown as TokenResponse),
    ).rejects.toBeInstanceOf(TypeError);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('usa TTL pre-auth 300 e rifiuta token fuori grammatica', async () => {
    await setPreAuthCookie('pre.auth-token');
    expect(PRE_AUTH_MAX_AGE).toBe(300);
    expect(cookieStore.set).toHaveBeenCalledWith(
      config.auth.preAuthCookie,
      'pre.auth-token',
      expect.objectContaining({ maxAge: 300, httpOnly: true }),
    );

    cookieStore.set.mockClear();
    await expect(setPreAuthCookie('pre-auth-caf\u00e9')).rejects.toBeInstanceOf(TypeError);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('non inoltra cookie preesistenti malformati', async () => {
    cookieStore.get.mockReturnValue({ value: 'token with spaces' });
    await expect(getAccessToken()).resolves.toBeNull();
    await expect(getRefreshToken()).resolves.toBeNull();
    await expect(getPreAuthCookie()).resolves.toBeNull();
  });
});
