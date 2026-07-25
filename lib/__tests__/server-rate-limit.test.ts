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

  it('fails closed with 503 when Upstash is not configured', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
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
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.test');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'secret');
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
});
