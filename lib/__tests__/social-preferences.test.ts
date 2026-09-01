import { describe, expect, it } from 'vitest';

import { getEbartexProfileUrl } from '@/lib/social-preferences';

describe('link ai profili Ebartex', () => {
  it('usa lo username Ebartex nella rotta /users', () => {
    expect(getEbartexProfileUrl('ebartex_seller')).toBe(
      'https://www.ebartex.com/users/ebartex_seller',
    );
  });

  it('non costruisce /users usando il gamertag torneo mancante', () => {
    expect(getEbartexProfileUrl(null)).toBe('https://www.ebartex.com/search/user');
  });
});
