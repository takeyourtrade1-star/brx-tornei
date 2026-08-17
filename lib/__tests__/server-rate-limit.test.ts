import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  enforceServerRateLimit,
  ServerRateLimitExceeded,
  ServerRateLimitUnavailable,
  statusForServerRateLimitError,
} from '@/lib/security/server-rate-limit';

describe('server rate limit', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('falls back to the bounded per-instance limiter when Upstash is absent', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    await enforceServerRateLimit({ scope: 'scanner', subject: 'user-1', limit: 10 });
    const error = await enforceServerRateLimit({
      scope: 'scanner',
      subject: 'user-1',
      limit: 1,
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ServerRateLimitExceeded);
    expect(statusForServerRateLimitError(error)).toBe(429);
  });

  it('fails closed for sensitive auth limits when Upstash is absent in production', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const error = await enforceServerRateLimit({
      scope: 'auth-login',
      subject: 'user@example.test',
      limit: 5,
      requireDistributedStore: true,
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ServerRateLimitUnavailable);
    expect(statusForServerRateLimitError(error)).toBe(503);
  });

  it('fails closed with 503 on partial or invalid Upstash configuration', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis-test.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const error = await enforceServerRateLimit({
      scope: 'scanner',
      subject: 'user-1',
      limit: 10,
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ServerRateLimitUnavailable);
    expect(statusForServerRateLimitError(error)).toBe(503);
  });

  it('maps an exceeded authenticated-user quota to 429', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis-test.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 's'.repeat(48));
    vi.stubEnv('UPSTASH_REDIS_ALLOWED_HOSTNAME', 'redis-test.upstash.io');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ result: 11 }, { result: 1 }]), {
          status: 200,
        }),
      ),
    );
    const error = await enforceServerRateLimit({
      scope: 'scanner',
      subject: 'user-1',
      limit: 10,
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ServerRateLimitExceeded);
    expect(statusForServerRateLimitError(error)).toBe(429);
  });

  it('increments and repairs a missing expiry atomically in one Redis script', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis-test.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 's'.repeat(48));
    vi.stubEnv('UPSTASH_REDIS_ALLOWED_HOSTNAME', 'redis-test.upstash.io');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ result: 1 }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await enforceServerRateLimit({
      scope: 'catalog',
      subject: 'user-1',
      limit: 10,
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const commands = JSON.parse(String(init.body)) as unknown[][];
    expect(commands).toHaveLength(1);
    expect(commands[0]?.[0]).toBe('EVAL');
    const script = String(commands[0]?.[1]);
    expect(script).toContain("redis.call('TTL', KEYS[1])");
    expect(script).toContain('count == 1 or ttl < 0');
    expect(script).toContain("redis.call('EXPIRE', KEYS[1], ARGV[1])");
  });
});
