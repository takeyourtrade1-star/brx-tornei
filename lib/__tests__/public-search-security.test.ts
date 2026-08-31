import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('server-only', () => ({}));

import { getRateLimitClientIp } from '@/lib/security/client-ip';
import { MAX_PAGE, normalizePage } from '@/lib/search/search-request-utils';

describe('public search abuse boundary', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses the CloudFront-appended rightmost XFF hop', () => {
    const request = new Request('https://tornei.ebartex.com/api/search', {
      headers: { 'x-forwarded-for': '6.6.6.6, 203.0.113.10' },
    });

    expect(getRateLimitClientIp(request)).toBe('203.0.113.10');
  });

  it('accepts only an allowlisted single-value infrastructure header', () => {
    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'cloudfront-viewer-address');
    const request = new Request('https://tornei.ebartex.com/api/search', {
      headers: { 'cloudfront-viewer-address': '203.0.113.12:43120' },
    });
    expect(getRateLimitClientIp(request)).toBe('203.0.113.12');

    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'x-attacker-ip');
    expect(getRateLimitClientIp(request)).toBe('unknown');
  });

  it('caps deep pagination and declares a distributed route quota', () => {
    expect(normalizePage('100000')).toBe(MAX_PAGE);
    const route = readFileSync(
      new URL('../../app/api/search/route.ts', import.meta.url),
      'utf8',
    );
    expect(route).toContain("scope: 'public-catalog-search'");
    expect(route).toContain('getRateLimitClientIp(request)');
    expect(route).toContain("'Retry-After': '60'");
  });

  it('does not introduce an Upstash dependency into auth actions', () => {
    const client = readFileSync(
      new URL('../data/auth-action-client.ts', import.meta.url),
      'utf8',
    );
    const actions = readFileSync(
      new URL('../../actions/auth.ts', import.meta.url),
      'utf8',
    );
    const route = readFileSync(
      new URL('../../app/api/auth/[...path]/route.ts', import.meta.url),
      'utf8',
    );
    expect(client).not.toContain('server-rate-limit');
    expect(client).not.toContain('getRateLimitClientIpFromHeaders');
    expect(actions).not.toContain('authRateLimitError');
    expect(route).not.toContain('auth-bff-rate-limit');
    expect(route).not.toContain('server-rate-limit');
  });
});
