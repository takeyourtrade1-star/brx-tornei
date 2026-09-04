import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getAccessToken: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getAccessToken: mocks.getAccessToken }));

const SITE = 'https://tornei.ebartex.com';

function request(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`${SITE}/api/tournaments/social-room/ticket`, {
    method: 'POST',
    headers: {
      Origin: SITE,
      'Sec-Fetch-Site': 'same-origin',
      ...headers,
    },
  });
}

describe('BFF ticket Sala Piazza', () => {
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

  it('rifiuta la richiesta cross-site senza contattare il backend', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/tournaments/social-room/ticket/route');

    const response = await POST(request({ Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site' }));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rifiuta senza bearer quando la sessione cookie non è presente', async () => {
    mocks.getAccessToken.mockResolvedValueOnce(null);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/tournaments/social-room/ticket/route');

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('legge il cookie server-side e inoltra solo il bearer al path fisso', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ ticket: 'one-use', expires_in_seconds: 30 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/tournaments/social-room/ticket/route');

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ticket: 'one-use', expires_in_seconds: 30 });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe('http://127.0.0.1:8002/api/tournaments/social-room/ticket');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer access.valid');
    expect(init.body).toBeUndefined();
    expect(init.redirect).toBe('error');
  });

  it('non espone campi extra upstream oltre al ticket one-use', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({
        ticket: 'one-use',
        expires_in_seconds: 30,
        access_token: 'must-not-reach-browser',
      }),
    ));
    const { POST } = await import('@/app/api/tournaments/social-room/ticket/route');

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'invalid ticket response' });
  });

  it('fallisce chiuso su risposta upstream oltre il limite', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('x'.repeat(64 * 1024 + 1), { status: 200 }),
    ));
    const { POST } = await import('@/app/api/tournaments/social-room/ticket/route');

    const response = await POST(request());

    expect(response.status).toBe(502);
  });
});
