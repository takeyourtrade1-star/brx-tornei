import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({
  config: {
    app: { siteUrl: 'https://tornei.ebartex.com' },
    api: { baseURL: 'https://auth.ebartex.com', timeout: 1_000 },
    auth: { refreshCookie: '__Host-ebartex_refresh_token' },
  },
}));

import { GET } from '../../app/auth/bridge/route';
import { POST as consumeBridgeNonce } from '../../app/api/auth/bridge/consume/route';

const nonce = 'a'.repeat(32);
const sessionCookies =
  `__Host-ebartex_bridge_nonce=${nonce}; __Host-ebartex_refresh_token=refresh-token`;

describe('auth bridge CSRF boundary', () => {
  it('rejects a direct navigation without the middleware nonce', async () => {
    const response = await GET(
      new NextRequest('https://tornei.ebartex.com/auth/bridge?next=%2Ftornei', {
        headers: { cookie: '__Host-ebartex_refresh_token=refresh-token' },
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.headers.get('set-cookie')).toContain(
      '__Host-ebartex_bridge_nonce=;',
    );
  });

  it('only forwards a matching nonce and sanitized local destination', async () => {
    const response = await GET(new NextRequest(
      `https://tornei.ebartex.com/auth/bridge?nonce=${nonce}` +
        '&next=https%3A%2F%2Fevil.example%2Fsteal',
      { headers: { cookie: sessionCookies } },
    ));

    const location = new URL(response.headers.get('location')!);
    expect(location.pathname).toBe('/auth/bridge/continue');
    expect(location.searchParams.get('nonce')).toBe(nonce);
    expect(location.searchParams.get('next')).toBe('/tornei?format=all&mode=heads-up');
    expect(location.href).not.toContain('evil.example');
  });

  it('consumes the nonce only for a same-origin matching request', async () => {
    const valid = await consumeBridgeNonce(new NextRequest(
      'https://tornei.ebartex.com/api/auth/bridge/consume',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://tornei.ebartex.com',
          cookie: sessionCookies,
        },
        body: JSON.stringify({ nonce }),
      },
    ));
    expect(valid.status).toBe(200);
    expect(valid.headers.get('set-cookie')).toContain('__Host-ebartex_bridge_nonce=;');

    const crossSite = await consumeBridgeNonce(new NextRequest(
      'https://tornei.ebartex.com/api/auth/bridge/consume',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://evil.example',
          cookie: sessionCookies,
        },
        body: JSON.stringify({ nonce }),
      },
    ));
    expect(crossSite.status).toBe(403);
  });
});
