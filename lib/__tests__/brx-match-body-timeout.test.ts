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

const SITE = 'https://tornei.ebartex.com';
const USER_ID = '018f0f8d-5f34-7d9f-8fc2-a12a43ca10d1';
const routeContext = { params: Promise.resolve({ path: ['search-vector'] }) };

function streamRequest(body: ReadableStream<Uint8Array>): NextRequest {
  return new NextRequest(`${SITE}/brx-match/search-vector`, {
    method: 'POST',
    headers: {
      'content-type': 'application/octet-stream',
      origin: SITE,
      'sec-fetch-site': 'same-origin',
    },
    body,
    duplex: 'half',
  });
}

describe('BRX Match request-body deadline', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('BRX_MATCH_API_URL', 'http://127.0.0.1:8090');
    vi.stubEnv('BRX_MATCH_INTERNAL_TOKEN', 't'.repeat(32));
    vi.stubEnv('BRX_MATCH_INTERNAL_CALLER', 'brx-tornei');
    mocks.getSession.mockReset().mockResolvedValue({
      user: { id: USER_ID, email: 'user@example.test', name: null },
    });
    mocks.enforceServerRateLimit.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('risponde 408, cancella lo stream e non contatta upstream senza primo chunk', async () => {
    const fetchMock = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/brx-match/[...path]/route');
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        return new Promise<void>(() => undefined);
      },
      cancel,
    });

    const pending = POST(streamRequest(stream), routeContext);
    await vi.advanceTimersByTimeAsync(10_000);
    const response = await pending;

    expect(response.status).toBe(408);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(cancel).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('applica la deadline totale anche dopo un primo chunk valido', async () => {
    const fetchMock = vi.fn();
    const cancel = vi.fn();
    let first = true;
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/brx-match/[...path]/route');
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (first) {
          first = false;
          controller.enqueue(new Uint8Array([1]));
          return;
        }
        return new Promise<void>(() => undefined);
      },
      cancel,
    });

    const pending = POST(streamRequest(stream), routeContext);
    await vi.advanceTimersByTimeAsync(10_000);
    const response = await pending;

    expect(response.status).toBe(408);
    expect(cancel).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
