import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getRefreshToken: vi.fn(),
  clearSessionCookies: vi.fn(),
  clearPreAuthCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({
  clearSessionCookies: mocks.clearSessionCookies,
  getRefreshToken: mocks.getRefreshToken,
  setSessionCookies: vi.fn(),
}));
vi.mock('@/lib/auth/pre-auth-cookie', () => ({
  clearPreAuthCookie: mocks.clearPreAuthCookie,
  getPreAuthCookie: vi.fn(),
  setPreAuthCookie: vi.fn(),
}));
vi.mock('@/lib/data/auth-action-client', () => ({
  authFetch: vi.fn(),
  authRateLimitError: vi.fn(),
  extractAuthError: vi.fn(),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

describe('logoutAction', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('AUTH_API_URL', 'http://127.0.0.1:8000');
    mocks.getRefreshToken.mockResolvedValue('refresh.logout-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('pulisce sempre i cookie locali quando la revoca Auth fallisce', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);
    const { logoutAction } = await import('@/actions/auth');

    await logoutAction();

    expect(mocks.clearPreAuthCookie).toHaveBeenCalledTimes(1);
    expect(mocks.clearSessionCookies).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith('/login');
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBe(JSON.stringify({ refresh_token: 'refresh.logout-token' }));
  });

  it('non espone o logga credenziali anche se Auth risponde con token', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: 'must-never-reach-client',
      refresh_token: 'must-never-reach-client',
    }), { status: 500, headers: { 'content-type': 'application/json' } })));
    const { logoutAction } = await import('@/actions/auth');

    await expect(logoutAction()).resolves.toBeUndefined();
    const logs = JSON.stringify([
      ...logSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls,
    ]);
    expect(logs).not.toContain('must-never-reach-client');
    expect(mocks.clearPreAuthCookie).toHaveBeenCalledTimes(1);
    expect(mocks.clearSessionCookies).toHaveBeenCalledTimes(1);
  });
});
