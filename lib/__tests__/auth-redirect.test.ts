import { describe, expect, it } from 'vitest';

import {
  DEFAULT_POST_LOGIN_PATH,
  sanitizeRedirect,
} from '@/lib/auth/redirect';

describe('auth redirect boundary', () => {
  it('preserves only same-origin pathname and query', () => {
    expect(sanitizeRedirect('/tornei/abc?tab=live#client-fragment')).toBe(
      '/tornei/abc?tab=live',
    );
  });

  it.each([
    '//evil.example/path',
    '/\\evil.example/path',
    '/%5cevil.example/path',
    '/%5Cevil.example/path',
    '/%2f%2fevil.example/path',
    'https://evil.example/path',
    '/safe\nSet-Cookie: bad=1',
    `/${'a'.repeat(2048)}`,
  ])('rejects ambiguous or external destination %s', (value) => {
    expect(sanitizeRedirect(value)).toBe(DEFAULT_POST_LOGIN_PATH);
  });
});
