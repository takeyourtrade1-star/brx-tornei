import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  enforceServerRateLimit: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/security/server-rate-limit', () => ({
  enforceServerRateLimit: mocks.enforceServerRateLimit,
  statusForServerRateLimitError: () => 503,
}));

import { GET } from '../../app/brx-match/[...path]/route';

const USER_UUID_V7 = '018f0f8d-5f34-7d9f-8fc2-a12a43ca10d1';
const routeContext = {
  params: Promise.resolve({ path: ['capabilities'] }),
};

function capabilitiesResponse(): Response {
  return Response.json({
    status: 'ok',
    pipeline_version: 'test-v1',
    model_loaded: true,
    index_ready: true,
    edge_model: {
      size: 1_000_000,
      sha256: 'a'.repeat(64),
    },
  });
}

describe('BRX Match UUIDv7 route boundary', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('BRX_MATCH_API_URL', 'http://127.0.0.1:8090');
    vi.stubEnv('BRX_MATCH_INTERNAL_TOKEN', 't'.repeat(32));
    vi.stubEnv('BRX_MATCH_INTERNAL_CALLER', 'brx-tornei');
    mocks.getSession.mockReset();
    mocks.enforceServerRateLimit.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('carries a canonical Auth UUIDv7 through session, quota, and S2S identity', async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: USER_UUID_V7, email: 'user@example.test', name: null },
    });
    const fetchMock = vi.fn().mockResolvedValue(capabilitiesResponse());
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(
      new NextRequest('https://tornei.example.test/brx-match/capabilities'),
      routeContext,
    );

    expect(response.status).toBe(200);
    expect(mocks.enforceServerRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ subject: USER_UUID_V7 }),
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('X-Internal-Rate-Subject')).toBe(USER_UUID_V7);
  });

  it.each([
    USER_UUID_V7.toUpperCase(),
    '00000000-0000-0000-0000-000000000000',
    USER_UUID_V7.replaceAll('-', ''),
  ])('rejects a non-canonical session identity before quota or upstream: %s', async (id) => {
    mocks.getSession.mockResolvedValue({
      user: { id, email: 'user@example.test', name: null },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(
      new NextRequest('https://tornei.example.test/brx-match/capabilities'),
      routeContext,
    );

    expect(response.status).toBe(401);
    expect(mocks.enforceServerRateLimit).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
