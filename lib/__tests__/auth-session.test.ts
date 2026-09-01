import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('react', () => ({
  cache: (fn: (...args: never[]) => unknown) => fn,
}));

import { normalizeSessionUser } from '@/lib/auth/session';

describe('normalizzazione sessione Auth', () => {
  it('conserva username Ebartex e usa name solo come etichetta visuale', () => {
    expect(normalizeSessionUser({
      id: 'user-1',
      email: 'user@example.test',
      username: 'ebartex_seller',
      name: 'Nome visualizzato',
    })).toEqual({
      id: 'user-1',
      email: 'user@example.test',
      username: 'ebartex_seller',
      name: 'Nome visualizzato',
    });
  });

  it('non usa name o gamertag come username quando il backend non lo restituisce', () => {
    expect(normalizeSessionUser({
      id: 'user-2',
      email: 'user2@example.test',
      name: 'Gamertag torneo',
    })).toMatchObject({
      username: null,
      name: 'Gamertag torneo',
    });
  });
});
