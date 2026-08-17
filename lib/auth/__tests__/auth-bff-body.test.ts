import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/security/server-rate-limit', () => ({
  enforceServerRateLimit: vi.fn().mockResolvedValue(undefined),
  statusForServerRateLimitError: vi.fn(() => 503),
}));

const SITE = 'https://tornei.ebartex.com';

function streamRequest(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): NextRequest {
  const init: NonNullable<ConstructorParameters<typeof NextRequest>[1]> = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: SITE,
      'sec-fetch-site': 'same-origin',
    },
    body,
    ...(signal ? { signal } : {}),
    duplex: 'half',
  };
  return new NextRequest(`${SITE}/api/auth/login`, init);
}

const context = { params: Promise.resolve({ path: ['login'] }) };

describe('auth BFF bounded request body', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('AUTH_API_URL', 'http://127.0.0.1:8000');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('risponde 408/no-store alla deadline senza chiamare upstream', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        return new Promise<void>(() => undefined);
      },
    });

    const pending = POST(streamRequest(stream), context);
    await vi.advanceTimersByTimeAsync(10_000);
    const response = await pending;

    expect(response.status).toBe(408);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('risponde 408 quando il client abortisce la request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const controller = new AbortController();
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        return new Promise<void>(() => undefined);
      },
    });

    const pending = POST(streamRequest(stream, controller.signal), context);
    controller.abort();
    const response = await pending;

    expect(response.status).toBe(408);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ferma il chunk flooding entro il ceiling senza chiamare upstream', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let index = 0; index < 257; index += 1) {
          controller.enqueue(new Uint8Array([0x20]));
        }
        controller.close();
      },
    });

    const response = await POST(streamRequest(stream), context);
    expect(response.status).toBe(413);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
