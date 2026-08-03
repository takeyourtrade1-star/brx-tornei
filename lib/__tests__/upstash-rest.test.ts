import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  executeUpstashPipeline,
  parseUpstashRedisConfig,
} from '@/lib/security/upstash-rest';

const VALID_TOKEN = 't'.repeat(48);
const VALID_URL = 'https://secure-redis-12345.upstash.io';
const VALID_HOSTNAME = 'secure-redis-12345.upstash.io';

describe('Upstash REST transport security', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('accepts only a canonical allowlisted production origin', () => {
    expect(
      parseUpstashRedisConfig(VALID_URL, VALID_TOKEN, 'production', VALID_HOSTNAME),
    ).toEqual({ origin: VALID_URL, token: VALID_TOKEN });
  });

  it.each([
    'http://secure-redis-12345.upstash.io',
    'https://user@secure-redis-12345.upstash.io',
    'https://secure-redis-12345.upstash.io/pipeline',
    'https://secure-redis-12345.upstash.io?next=evil',
    'https://secure-redis-12345.upstash.io#fragment',
    'https://secure-redis-12345.upstash.io.evil.test',
    'https://secure-redis-12345.upstash.io:8443',
  ])('rejects a hostile production URL: %s', (url) => {
    expect(() =>
      parseUpstashRedisConfig(url, VALID_TOKEN, 'production', VALID_HOSTNAME),
    ).toThrow();
  });

  it('rejects partial configuration and malformed tokens', () => {
    expect(() => parseUpstashRedisConfig(VALID_URL, '', 'production', VALID_HOSTNAME)).toThrow();
    expect(() => parseUpstashRedisConfig('', VALID_TOKEN, 'production', VALID_HOSTNAME)).toThrow();
    expect(() => parseUpstashRedisConfig(VALID_URL, 'short', 'production', VALID_HOSTNAME)).toThrow();
    expect(() =>
      parseUpstashRedisConfig(VALID_URL, `${VALID_TOKEN}\n`, 'production', VALID_HOSTNAME),
    ).toThrow();
  });

  it('rejects a different valid Upstash tenant before a bearer token can be used', () => {
    expect(() =>
      parseUpstashRedisConfig(
        'https://attacker-redis-99999.upstash.io',
        VALID_TOKEN,
        'production',
        VALID_HOSTNAME,
      ),
    ).toThrow('exact allowlist');
  });

  it('forbids redirects before attaching the bearer credential', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', VALID_URL);
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', VALID_TOKEN);
    vi.stubEnv('UPSTASH_REDIS_ALLOWED_HOSTNAME', VALID_HOSTNAME);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ result: 1 }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await executeUpstashPipeline([['PING']]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${VALID_URL}/pipeline`);
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).redirect).toBe('error');
  });

  it('rejects redirects and oversized responses', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', VALID_URL);
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', VALID_TOKEN);
    vi.stubEnv('UPSTASH_REDIS_ALLOWED_HOSTNAME', VALID_HOSTNAME);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 302 })));
    await expect(executeUpstashPipeline([['PING']])).rejects.toThrow();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('[]', {
          status: 200,
          headers: { 'content-length': String(256 * 1024 + 1) },
        }),
      ),
    );
    await expect(executeUpstashPipeline([['PING']])).rejects.toThrow(
      'upstream response too large',
    );
  });
});
