import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({
  getAccessToken: mocks.getAccessToken,
}));

const SITE = 'https://tornei.ebartex.com';
const SESSION_ID = '018f0f8d-5f34-7d9f-afc2-a12a43ca10d3';

function context(sessionId = SESSION_ID) {
  return { params: Promise.resolve({ sessionId }) };
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest(`${SITE}/api/tournaments/signaling/${SESSION_ID}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: SITE,
      'sec-fetch-site': 'same-origin',
    },
    body: JSON.stringify(body),
  });
}

describe('Tournament signaling BFF boundary', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('TOURNAMENTS_API_URL', 'http://127.0.0.1:8002');
    mocks.getAccessToken.mockReset().mockResolvedValue('access.valid');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('rifiuta session UUID non canoniche prima di contattare il backend', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/tournaments/signaling/[sessionId]/route');
    const response = await GET(
      new NextRequest(`${SITE}/api/tournaments/signaling/not-a-uuid?role=host&since=0`),
      context('not-a-uuid'),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { from: 'observer', kind: 'offer', data: {} },
    { from: 'host', kind: 'arbitrary', data: {} },
    { from: 'host', kind: 'offer', data: {}, extra: true },
  ])('rifiuta un body signaling fuori schema: %j', async (body) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/tournaments/signaling/[sessionId]/route');
    const response = await POST(postRequest(body), context());

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('richiede un ruolo esatto e un cursore intero sicuro su GET', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/tournaments/signaling/[sessionId]/route');

    const missingRole = await GET(
      new NextRequest(`${SITE}/api/tournaments/signaling/${SESSION_ID}?since=0`),
      context(),
    );
    const invalidSince = await GET(
      new NextRequest(`${SITE}/api/tournaments/signaling/${SESSION_ID}?role=host&since=-1`),
      context(),
    );

    expect(missingRole.status).toBe(400);
    expect(invalidSince.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('inoltra soltanto un messaggio tipizzato con il bearer server-side', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ ok: true, seq: 1 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/tournaments/signaling/[sessionId]/route');
    const body = { from: 'guest', kind: 'candidate', data: { candidate: 'safe' } };
    const response = await POST(postRequest(body), context());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/v1/signaling/${SESSION_ID}/messages`);
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer access.valid');
    expect(init.body).toBe(JSON.stringify(body));
  });

  it('mantiene il rifiuto 403 del ruolo verificato dal Tournament Service', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json(
        { detail: { code: 'SIGNALING_ROLE_MISMATCH' } },
        { status: 403 },
      ),
    ));
    const { GET } = await import('@/app/api/tournaments/signaling/[sessionId]/route');
    const response = await GET(
      new NextRequest(
        `${SITE}/api/tournaments/signaling/${SESSION_ID}?role=host&since=0`,
      ),
      context(),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      detail: { code: 'SIGNALING_ROLE_MISMATCH' },
    });
  });
});
