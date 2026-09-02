import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('react', () => ({ cache: <T>(value: T) => value }));
const cookieStore = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import { config } from '@/lib/config';
import { getSession } from '@/lib/auth/session';
import {
  getCachedSession,
  isTransientAuthStatus,
  setCachedSession,
} from '@/lib/auth/session-cache';

const userPayload = JSON.stringify({
  id: '11111111-1111-4111-8111-111111111111',
  email: 'player@example.test',
  username: 'player',
});

function jsonResponse(status: number, body = userPayload): Response {
  return new Response(status === 204 ? null : body, {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('session micro-cache', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    cookieStore.get.mockReset();
  });

  it('un 429 del backend Auth non diventa un logout: retry singolo e cache', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, JSON.stringify({ detail: 'Rate limit exceeded' })))
      .mockResolvedValueOnce(jsonResponse(200));
    vi.stubGlobal('fetch', fetchMock);
    cookieStore.get.mockReturnValue({ value: 'access.token-cache' });

    await expect(getSession()).resolves.toHaveProperty('user.username', 'player');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    // La seconda lettura nella stessa finestra non contatta più il backend.
    await expect(getSession()).resolves.toHaveProperty('user.username', 'player');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('un 401 vero e proprio è un logout immediato, senza retry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401));
    vi.stubGlobal('fetch', fetchMock);
    cookieStore.get.mockReturnValue({ value: 'access.token-expired' });

    await expect(getSession()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('cachè il positivo ma invalida per token diverso', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200));
    vi.stubGlobal('fetch', fetchMock);

    cookieStore.get.mockReturnValueOnce({ value: 'access.token-one' })
      .mockReturnValueOnce({ value: 'access.token-one' })
      .mockReturnValueOnce({ value: 'access.token-two' });

    await getSession();
    await getSession();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await getSession();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('isTransientAuthStatus', () => {
  it('tratta 429 e 5xx come transient, il resto come verdetto', () => {
    expect(isTransientAuthStatus(429)).toBe(true);
    expect(isTransientAuthStatus(500)).toBe(true);
    expect(isTransientAuthStatus(503)).toBe(true);
    expect(isTransientAuthStatus(401)).toBe(false);
    expect(isTransientAuthStatus(403)).toBe(false);
    expect(isTransientAuthStatus(200)).toBe(false);
  });
});

describe('session-cache eviction', () => {
  it('mantiene un numero limitato di entry', () => {
    for (let i = 0; i < 80; i += 1) setCachedSession(`token-${i}`, null);
    expect(getCachedSession('token-0')).toBeNull();
    expect(getCachedSession('token-79')).not.toBeNull();
  });
});
