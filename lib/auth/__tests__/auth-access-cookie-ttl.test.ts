import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  clampAuthCookieMaxAge,
  resolveAccessCookieMaxAge,
} from '@/lib/auth/auth-token';

function jwtWithExp(expEpochSeconds: number): string {
  const b64 = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ exp: expEpochSeconds })}.sig`;
}

describe('resolveAccessCookieMaxAge', () => {
  it('deriva il TTL dal claim exp del JWT con margine di 90s', () => {
    const now = Math.floor(Date.now() / 1000);
    const ttl = resolveAccessCookieMaxAge(jwtWithExp(now + 3_600), undefined, 300);
    expect(ttl).toBeGreaterThanOrEqual(3_600 - 90 - 2);
    expect(ttl).toBeLessThanOrEqual(3_600 - 90);
  });

  it('rispetta il tetto massimo anche per JWT molto lunghi', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(resolveAccessCookieMaxAge(jwtWithExp(now + 86_400), undefined, 300))
      .toBe(3_660);
  });

  it('non scende sotto il minimo quando il JWT è quasi scaduto', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(resolveAccessCookieMaxAge(jwtWithExp(now + 10), undefined, 300)).toBe(30);
  });

  it.each([
    'not-a-jwt',
    'a.b.c.d',
    `header.${Buffer.from('{"exp": "soon"}').toString('base64url')}.sig`,
  ])('torna al fallback storico per token non JWT: %s', (token) => {
    expect(resolveAccessCookieMaxAge(token, undefined, 300)).toBe(300);
  });

  it('usa expires_in dichiarato quando il token non è un JWT', () => {
    expect(resolveAccessCookieMaxAge('opaque-token', 75, 300)).toBe(75);
    expect(clampAuthCookieMaxAge(Number.MAX_SAFE_INTEGER, 300, 300)).toBe(300);
  });
});
