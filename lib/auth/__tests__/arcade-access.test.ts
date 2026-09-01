import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mocks.get,
    set: mocks.set,
  }),
}));

import {
  ARCADE_ACCESS_COOKIE,
  ARCADE_ACCESS_MAX_AGE_SECONDS,
  grantArcadeAccess,
  hasArcadeAccess,
  isArcadeAccessConfigured,
  verifyArcadeAccessToken,
  verifyArcadePassword,
} from '@/lib/auth/arcade-access';

const PASSWORD = 'arcade-test-password-very-long';

describe('accesso riservato Sala Arcade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ARCADE_ROOM_ACCESS_PASSWORD', PASSWORD);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('confronta la password esatta senza esporla al client', () => {
    expect(isArcadeAccessConfigured()).toBe(true);
    expect(verifyArcadePassword(PASSWORD)).toBe(true);
    expect(verifyArcadePassword(` ${PASSWORD}`)).toBe(false);
    expect(verifyArcadePassword('password-errata')).toBe(false);
  });

  it('fallisce chiuso quando la password server non è valida', () => {
    vi.stubEnv('ARCADE_ROOM_ACCESS_PASSWORD', 'corta');
    expect(isArcadeAccessConfigured()).toBe(false);
    expect(verifyArcadePassword('corta')).toBe(false);
  });

  it('emette un cookie __Host- HttpOnly sicuro e legato all’utente', async () => {
    await expect(grantArcadeAccess('user-1')).resolves.toBe(true);

    expect(mocks.set).toHaveBeenCalledTimes(1);
    const [name, token, options] = mocks.set.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(name).toBe(ARCADE_ACCESS_COOKIE);
    expect(token).not.toContain(PASSWORD);
    expect(options).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: ARCADE_ACCESS_MAX_AGE_SECONDS,
    });
    expect(verifyArcadeAccessToken(token, 'user-1')).toBe(true);
    expect(verifyArcadeAccessToken(token, 'user-2')).toBe(false);
  });

  it('rifiuta token alterati, scaduti o firmati con la password precedente', async () => {
    await grantArcadeAccess('user-1');
    const token = mocks.set.mock.calls[0]?.[1] as string;
    const [body, signature] = token.split('.');

    expect(verifyArcadeAccessToken(`${body}x.${signature}`, 'user-1')).toBe(false);
    expect(
      verifyArcadeAccessToken(
        token,
        'user-1',
        Math.floor(Date.now() / 1000) + ARCADE_ACCESS_MAX_AGE_SECONDS + 1,
      ),
    ).toBe(false);

    vi.stubEnv('ARCADE_ROOM_ACCESS_PASSWORD', `${PASSWORD}-rotated`);
    expect(verifyArcadeAccessToken(token, 'user-1')).toBe(false);
  });

  it('riconosce il cookie valido solo per la sessione corrente', async () => {
    await grantArcadeAccess('user-1');
    const token = mocks.set.mock.calls[0]?.[1] as string;
    mocks.get.mockReturnValue({ value: token });

    await expect(hasArcadeAccess('user-1')).resolves.toBe(true);
    expect(mocks.get).toHaveBeenCalledWith(ARCADE_ACCESS_COOKIE);
    await expect(hasArcadeAccess('user-2')).resolves.toBe(false);
  });
});
