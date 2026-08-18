import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({
  config: {
    api: { baseURL: 'https://auth.ebartex.com', timeout: 30_000 },
    app: {
      siteUrl: 'https://tornei.ebartex.com',
      mainSiteUrl: 'https://www.ebartex.com',
    },
    auth: {
      accessCookie: '__Host-ebartex_access_token',
      refreshCookie: '__Host-ebartex_refresh_token',
      preAuthCookie: '__Host-ebartex_pre_auth_token',
      accessMaxAge: 300,
      refreshMaxAge: 2_592_000,
    },
  },
}));

import { GET as startSso } from '../../app/auth/bridge/sso/start/route';
import { GET as finishSso } from '../../app/auth/bridge/sso/callback/route';
import {
  SSO_NEXT_COOKIE,
  SSO_STATE_COOKIE,
  SSO_VERIFIER_COOKIE,
} from '@/lib/auth/sso-handoff';

const CLIENT_SECRET = 's'.repeat(48);
const CODE = 'c'.repeat(43);
const STATE = 'a'.repeat(43);
const VERIFIER = 'v'.repeat(43);
const CALLBACK = 'https://tornei.ebartex.com/auth/bridge/sso/callback';
const fetchMock = vi.fn();

function callbackRequest(state = STATE): NextRequest {
  return new NextRequest(`${CALLBACK}?code=${CODE}&state=${state}`, {
    headers: {
      cookie:
        `${SSO_STATE_COOKIE}=${STATE}; ${SSO_VERIFIER_COOKIE}=${VERIFIER}; ` +
        `${SSO_NEXT_COOKIE}=/partite`,
      'user-agent': 'Browser/1.0',
    },
  });
}

beforeEach(() => {
  process.env.SSO_HANDOFF_ENABLED = 'true';
  process.env.SSO_TOURNAMENTS_CLIENT_SECRET = CLIENT_SECRET;
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  delete process.env.SSO_HANDOFF_ENABLED;
  delete process.env.SSO_TOURNAMENTS_CLIENT_SECRET;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('SSO Ebartex -> Tornei', () => {
  it('avvia PKCE senza mettere verifier, segreti o token nella URL', async () => {
    const response = await startSso(
      new NextRequest(
        'https://tornei.ebartex.com/auth/bridge/sso/start?next=%2Fpartite',
      ),
    );
    const location = new URL(response.headers.get('location')!);
    const verifier = response.cookies.get(SSO_VERIFIER_COOKIE)?.value;
    const state = response.cookies.get(SSO_STATE_COOKIE)?.value;

    expect(location.href).toMatch(
      /^https:\/\/www\.ebartex\.com\/api\/auth\/sso\/authorize\?/,
    );
    expect(location.searchParams.get('client_id')).toBe('tournaments');
    expect(location.searchParams.get('redirect_uri')).toBe(CALLBACK);
    expect(location.searchParams.get('state')).toBe(state);
    expect(location.searchParams.get('code_challenge_method')).toBe('S256');
    expect(location.searchParams.get('code_challenge')).toBe(
      createHash('sha256').update(verifier!, 'ascii').digest('base64url'),
    );
    expect(location.href).not.toContain(verifier!);
    expect(location.href).not.toContain(CLIENT_SECRET);
    expect(response.cookies.get(SSO_NEXT_COOKIE)?.value).toBe('/partite');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('ripiega sul login locale quando il broker non e configurato', async () => {
    delete process.env.SSO_HANDOFF_ENABLED;
    const response = await startSso(
      new NextRequest('https://tornei.ebartex.com/auth/bridge/sso/start'),
    );

    expect(response.headers.get('location')).toContain('/login?');
    expect(response.cookies.get(SSO_VERIFIER_COOKIE)).toBeUndefined();
  });

  it('sincronizza sempre la sessione Ebartex -> Tornei anche se e presente un cookie locale', async () => {
    const response = await startSso(
      new NextRequest(
        'https://tornei.ebartex.com/auth/bridge/sso/start?next=%2Fpartite',
        { headers: { cookie: '__Host-ebartex_access_token=access.local-token' } },
      ),
    );

    const location = new URL(response.headers.get('location')!);
    expect(location.href).toMatch(
      /^https:\/\/www\.ebartex\.com\/api\/auth\/sso\/authorize\?/,
    );
    expect(response.cookies.get(SSO_VERIFIER_COOKIE)).toBeDefined();
  });

  it('scambia il code solo server-to-server e imposta cookie host-only', async () => {
    const tokenBody = JSON.stringify({
      access_token: 'access.sso-token',
      refresh_token: 'refresh.sso-token',
      expires_in: 180,
    });
    fetchMock.mockResolvedValueOnce(
      new Response(tokenBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(Buffer.byteLength(tokenBody)),
        },
      }),
    );

    const response = await finishSso(callbackRequest());
    expect(response.headers.get('location')).toBe('https://tornei.ebartex.com/partite');
    expect(response.headers.get('location')).not.toContain(CODE);
    expect(response.cookies.get('__Host-ebartex_access_token')?.value).toBe(
      'access.sso-token',
    );
    expect(response.cookies.get('__Host-ebartex_access_token')).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 180,
    });
    expect(response.cookies.get('__Host-ebartex_refresh_token')?.value).toBe(
      'refresh.sso-token',
    );
    expect(response.cookies.get(SSO_STATE_COOKIE)?.value).toBe('');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    const body = JSON.parse(String(init.body)) as Record<string, string>;
    expect(url).toBe('https://auth.ebartex.com/api/auth/sso/exchange');
    expect(init.redirect).toBe('error');
    expect(headers.get('X-SSO-Client-Secret')).toBe(CLIENT_SECRET);
    expect(headers.get('User-Agent')).toBe('Browser/1.0');
    expect(body).toEqual({
      code: CODE,
      code_verifier: VERIFIER,
      redirect_uri: CALLBACK,
    });
  });

  it('non chiama Auth se lo state e assente o manomesso', async () => {
    const response = await finishSso(callbackRequest('b'.repeat(43)));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toContain('/login?');
    expect(response.cookies.get(SSO_VERIFIER_COOKIE)?.value).toBe('');
  });

  it('mantiene il flusso disponibile con origin HTTPS nel profilo production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await startSso(
      new NextRequest('https://tornei.ebartex.com/auth/bridge/sso/start'),
    );

    expect(response.headers.get('location')).toMatch(
      /^https:\/\/www\.ebartex\.com\/api\/auth\/sso\/authorize\?/,
    );
  });

  it('sanitizza la destinazione anche se il cookie next e ostile', async () => {
    const request = new NextRequest(`${CALLBACK}?error=login_required&state=${STATE}`, {
      headers: {
        cookie:
          `${SSO_STATE_COOKIE}=${STATE}; ${SSO_VERIFIER_COOKIE}=${VERIFIER}; ` +
          `${SSO_NEXT_COOKIE}=https://evil.example/steal`,
      },
    });
    const response = await finishSso(request);
    const location = new URL(response.headers.get('location')!);

    expect(location.origin).toBe('https://tornei.ebartex.com');
    expect(location.pathname).toBe('/login');
    expect(location.href).not.toContain('evil.example');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
