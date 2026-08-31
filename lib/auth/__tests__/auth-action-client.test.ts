import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
  headers: vi.fn(async () => new Headers({ 'user-agent': 'Browser/1.0' })),
}));

describe('auth action client response boundary', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('AUTH_API_URL', 'http://127.0.0.1:8000');
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('non applica trusted-device Set-Cookie su una risposta token malformata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: 'access-only',
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'set-cookie': '__Host-ebartex_mfa_trust=must-not-apply; Max-Age=3600',
      },
    })));
    const { authFetch } = await import('@/lib/data/auth-action-client');
    const result = await authFetch('/api/auth/login', { password: 'secret' });

    expect(result.ok).toBe(false);
    expect(result.body).toEqual({
      message: 'Risposta del servizio di autenticazione non valida',
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('mantiene la canonicalizzazione trusted-device dopo una coppia valida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: 'access.valid',
      refresh_token: 'refresh.valid',
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'set-cookie': '__Host-ebartex_mfa_trust=trusted-device; Domain=.example.test; Max-Age=99999999',
      },
    })));
    const { authFetch } = await import('@/lib/data/auth-action-client');
    const result = await authFetch('/api/auth/login', { password: 'secret' });

    expect(result.ok).toBe(true);
    expect(cookieStore.set).toHaveBeenCalledWith(
      '__Host-ebartex_mfa_trust',
      'trusted-device',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 2_592_000,
      }),
    );
  });

  it('non installa trusted-device da una risposta Auth non riuscita', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: 'Credenziali non valide',
    }), {
      status: 401,
      headers: {
        'content-type': 'application/json',
        'set-cookie': '__Host-ebartex_mfa_trust=must-not-apply; Max-Age=3600',
      },
    })));
    const { authFetch } = await import('@/lib/data/auth-action-client');
    const result = await authFetch('/api/auth/login', { password: 'wrong' });

    expect(result.ok).toBe(false);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('propaga una revoca trusted-device anche su risposta Auth non riuscita', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: 'Dispositivo revocato',
    }), {
      status: 401,
      headers: {
        'content-type': 'application/json',
        'set-cookie': '__Host-ebartex_mfa_trust=; Max-Age=0',
      },
    })));
    const { authFetch } = await import('@/lib/data/auth-action-client');
    await authFetch('/api/auth/login', { password: 'wrong' });

    expect(cookieStore.set).toHaveBeenCalledWith(
      '__Host-ebartex_mfa_trust',
      '',
      expect.objectContaining({ maxAge: 0 }),
    );
  });
});
