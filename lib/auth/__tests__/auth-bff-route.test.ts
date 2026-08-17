import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/security/server-rate-limit', () => ({
  enforceServerRateLimit: vi.fn().mockResolvedValue(undefined),
  statusForServerRateLimitError: vi.fn(() => 503),
}));

const SITE = 'https://tornei.ebartex.com';

function postRequest(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(`${SITE}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: SITE,
      'sec-fetch-site': 'same-origin',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function context(path: string) {
  return { params: Promise.resolve({ path: path.split('/') }) };
}

describe('auth BFF route hardening', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('AUTH_API_URL', 'http://127.0.0.1:8000');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('chiude metodi e path fuori dalla tabella esatta senza contattare Auth', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { GET, POST } = await import('@/app/api/auth/[...path]/route');

    const wrongMethod = await GET(
      new NextRequest(`${SITE}/api/auth/login`, { method: 'GET' }),
      context('login'),
    );
    const wrongRoute = await POST(
      postRequest('/api/auth/password/reset', {}),
      context('password/reset'),
    );

    expect(wrongMethod.status).toBe(404);
    expect(wrongRoute.status).toBe(404);
    expect(wrongMethod.headers.get('cache-control')).toContain('no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('imposta la coppia atomica, usa expires_in e cancella il pre-auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: 'access.token-1',
      refresh_token: 'refresh.token-1',
      expires_in: 120,
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const response = await POST(
      postRequest('/api/auth/login', { email: 'a@example.test', password: 'secret' }, {
        cookie: '__Host-ebartex_pre_auth_token=stale-preauth',
      }),
      context('login'),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: true });
    const cookies = response.headers.getSetCookie().join('\n');
    expect(cookies).toContain('__Host-ebartex_access_token=access.token-1');
    expect(cookies).toContain('Max-Age=120');
    expect(cookies).toContain('__Host-ebartex_refresh_token=refresh.token-1');
    expect(cookies).toContain('__Host-ebartex_pre_auth_token=;');
  });

  it('usa il fallback locale breve se Auth non dichiara expires_in', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: 'access.fallback',
      refresh_token: 'refresh.fallback',
    }), { status: 200, headers: { 'content-type': 'application/json' } })));
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const response = await POST(postRequest('/api/auth/login', {}), context('login'));

    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().join('\n')).toContain(
      '__Host-ebartex_access_token=access.fallback; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300',
    );
  });

  it.each([
    'aaaaaaaa.bbbbbbbb.cccccccc',
    { access_token: 'access-only' },
    { access_token: 'access', refresh_token: `r${'x'.repeat(3_800)}` },
    { accessToken: 'camel-access', refreshToken: 'camel-refresh' },
    { data: { nested: { preAuthToken: 'nested-alias' } } },
  ])('ritorna 502 senza mutare cookie per una risposta token malformata: %j', async (body) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'set-cookie': '__Host-ebartex_mfa_trust=must-not-apply; Max-Age=3600',
      },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const response = await POST(postRequest('/api/auth/login', {}), context('login'));

    expect(response.status).toBe(502);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(JSON.stringify(await response.json())).not.toContain('camel-access');
  });

  it('accetta pre-auth solo da login, con TTL 300 e senza esporlo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      pre_auth_token: 'pre.auth-token',
      mfa_required: true,
    }), { status: 200, headers: { 'content-type': 'application/json' } })));
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const response = await POST(postRequest('/api/auth/login', {}), context('login'));

    expect(await response.json()).toEqual({ mfa_required: true });
    const cookies = response.headers.getSetCookie().join('\n');
    expect(cookies).toContain('__Host-ebartex_pre_auth_token=;');
    expect(cookies).toContain('__Host-ebartex_pre_auth_token=pre.auth-token');
    expect(cookies).toContain('Max-Age=300');
  });

  it('rifiuta token completi dalla rotta register', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: 'wrong-route-access',
      refresh_token: 'wrong-route-refresh',
    }), { status: 201, headers: { 'content-type': 'application/json' } })));
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const response = await POST(postRequest('/api/auth/register', {}), context('register'));
    expect(response.status).toBe(502);
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('inietta pre-auth cookie-first e inoltra remember_device come booleano', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      access_token: 'access-after-mfa',
      refresh_token: 'refresh-after-mfa',
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const response = await POST(
      postRequest('/api/auth/verify-mfa', {
        mfa_code: '123456',
        remember_device: true,
        pre_auth_token: 'browser-token',
      }, { cookie: '__Host-ebartex_pre_auth_token=server-preauth' }),
      context('verify-mfa'),
    );

    expect(response.status).toBe(200);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBe(JSON.stringify({
      mfa_code: '123456',
      remember_device: true,
      pre_auth_token: 'server-preauth',
    }));
    expect(response.headers.getSetCookie().join('\n')).toContain(
      '__Host-ebartex_pre_auth_token=;',
    );
  });

  it('invia bearer+refresh al logout e pulisce localmente anche con Auth offline', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const response = await POST(
      postRequest('/api/auth/logout', {}, {
        cookie: '__Host-ebartex_access_token=access.logout; __Host-ebartex_refresh_token=refresh.logout',
      }),
      context('logout'),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ logged_out: true });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ Authorization: 'Bearer access.logout' });
    expect(init.body).toBe(JSON.stringify({ refresh_token: 'refresh.logout' }));
    const cookies = response.headers.getSetCookie().join('\n');
    expect(cookies).toContain('__Host-ebartex_access_token=;');
    expect(cookies).toContain('__Host-ebartex_refresh_token=;');
    expect(cookies).toContain('__Host-ebartex_pre_auth_token=;');
    expect(cookies).not.toContain('access.logout');
    expect(cookies).not.toContain('refresh.logout');
  });
});
