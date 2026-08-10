import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getRefreshToken: vi.fn(),
  clearSessionCookies: vi.fn(),
  setSessionCookies: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => mocks);
vi.mock('@/lib/config', () => ({
  config: {
    app: { siteUrl: 'https://tornei.ebartex.com' },
    api: { baseURL: 'https://auth.ebartex.com', timeout: 1_000 },
  },
}));

import { GET } from '../../app/auth/bridge/route';

describe('auth bridge CSRF boundary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a direct navigation without the middleware nonce before refresh', async () => {
    const response = await GET(
      new NextRequest('https://tornei.ebartex.com/auth/bridge?next=%2Ftornei', {
        headers: { cookie: '__Host-ebartex_refresh=refresh-token' },
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.headers.get('set-cookie')).toContain(
      '__Host-ebartex_bridge_nonce=;',
    );
    expect(mocks.getRefreshToken).not.toHaveBeenCalled();
  });
});
