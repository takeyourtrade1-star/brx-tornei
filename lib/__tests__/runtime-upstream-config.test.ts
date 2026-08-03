// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { trustedUpstreamOrigin } from '@/lib/config';

afterEach(() => vi.unstubAllEnvs());

describe('runtime upstream origin boundary', () => {
  it('accepts only an exact canonical production origin on the allowlist', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv(
      'TRUSTED_UPSTREAM_HOSTS',
      'auth.example.test,sync.example.test,tournaments.example.test',
    );

    expect(trustedUpstreamOrigin('https://auth.example.test')).toBe(
      'https://auth.example.test',
    );
    expect(trustedUpstreamOrigin('https://auth.example.test/')).toBe(
      'https://auth.example.test',
    );
  });

  it.each([
    'http://auth.example.test',
    'https://user:password@auth.example.test',
    'https://auth.example.test:443',
    'https://auth.example.test:444',
    'https://auth.example.test/v1',
    'https://auth.example.test?next=evil',
    'https://auth.example.test#fragment',
    'https://auth.example.test.evil.invalid',
    'https://127.0.0.1',
  ])('fails closed for a non-canonical or untrusted origin: %s', (value) => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', 'auth.example.test');
    expect(trustedUpstreamOrigin(value)).toBe('');
  });

  it('fails closed when the production allowlist is missing or malformed', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', '');
    expect(trustedUpstreamOrigin('https://auth.example.test')).toBe('');

    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', '*.example.test');
    expect(trustedUpstreamOrigin('https://auth.example.test')).toBe('');
  });

  it('allows plain HTTP only for a loopback development service', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(trustedUpstreamOrigin('http://localhost:8000')).toBe(
      'http://localhost:8000',
    );
    expect(trustedUpstreamOrigin('http://192.0.2.10:8000')).toBe('');
  });
});
