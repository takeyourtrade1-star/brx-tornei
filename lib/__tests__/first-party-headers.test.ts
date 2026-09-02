import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  serviceToken: { value: '' },
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('@/lib/config', () => ({
  config: {
    api: {
      get tournamentsServiceToken() {
        return mocks.serviceToken.value;
      },
    },
  },
}));

import {
  CLIENT_IP_HEADER,
  SERVICE_TOKEN_HEADER,
  firstPartyHeaders,
  isForwardableClientIp,
  pickClientIp,
} from '@/lib/data/first-party-headers';

function requestHeaders(values: Record<string, string>) {
  return {
    get: (name: string) => values[name.toLowerCase()] ?? null,
  };
}

describe('isForwardableClientIp', () => {
  it('accetta indirizzi pubblici', () => {
    for (const ip of ['9.9.9.9', '8.8.4.4', '2001:4860:4860::8888']) {
      expect(isForwardableClientIp(ip), ip).toBe(true);
    }
  });

  it('rifiuta tutto ciò che non identifica un giocatore', () => {
    // Un privato/loopback/CGNAT inoltrato collasserebbe l'utenza in un bucket.
    for (const ip of [
      '10.0.1.7',
      '172.16.4.1',
      '172.31.255.254',
      '192.168.1.4',
      '127.0.0.1',
      '169.254.10.1',
      '100.64.0.1',
      '0.0.0.0',
      '224.0.0.1',
      '::1',
      'fd00::1',
      'fe80::1',
      '',
      'non-un-ip',
      '999.1.1.1',
      '1.2.3',
    ]) {
      expect(isForwardableClientIp(ip), ip).toBe(false);
    }
  });
});

describe('pickClientIp', () => {
  it('prende il primo hop pubblico da sinistra', () => {
    expect(pickClientIp('9.9.9.9, 10.0.0.1, 10.0.0.2', null)).toBe('9.9.9.9');
  });

  it('salta gli hop di infrastruttura in testa alla catena', () => {
    expect(pickClientIp('10.0.0.1, 8.8.4.4', null)).toBe('8.8.4.4');
  });

  it('normalizza l IPv4 mappato in IPv6', () => {
    expect(pickClientIp('::ffff:9.9.9.9', null)).toBe('9.9.9.9');
  });

  it('ricade su x-real-ip quando la catena non è utilizzabile', () => {
    expect(pickClientIp('10.0.0.1', '8.8.8.8')).toBe('8.8.8.8');
  });

  it('restituisce stringa vuota quando nessun hop è pubblico', () => {
    expect(pickClientIp('10.0.0.1, 192.168.0.5', '127.0.0.1')).toBe('');
  });
});

describe('firstPartyHeaders', () => {
  it('non manda nulla senza token configurato', async () => {
    mocks.serviceToken.value = '';
    mocks.headers.mockResolvedValue(requestHeaders({ 'x-forwarded-for': '9.9.9.9' }));

    await expect(firstPartyHeaders()).resolves.toEqual({});
  });

  it('manda token e IP del giocatore quando è configurato', async () => {
    mocks.serviceToken.value = 't'.repeat(32);
    mocks.headers.mockResolvedValue(
      requestHeaders({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }),
    );

    await expect(firstPartyHeaders()).resolves.toEqual({
      [SERVICE_TOKEN_HEADER]: 't'.repeat(32),
      [CLIENT_IP_HEADER]: '9.9.9.9',
    });
  });

  it('manda il solo token quando l IP non è determinabile', async () => {
    // Il backend usa allora il tetto aggregato di servizio, non la quota peer.
    mocks.serviceToken.value = 't'.repeat(32);
    mocks.headers.mockResolvedValue(requestHeaders({ 'x-forwarded-for': '10.0.0.1' }));

    await expect(firstPartyHeaders()).resolves.toEqual({
      [SERVICE_TOKEN_HEADER]: 't'.repeat(32),
    });
  });

  it('non fallisce fuori da uno scope di request', async () => {
    mocks.serviceToken.value = 't'.repeat(32);
    mocks.headers.mockRejectedValue(new Error('outside request scope'));

    await expect(firstPartyHeaders()).resolves.toEqual({
      [SERVICE_TOKEN_HEADER]: 't'.repeat(32),
    });
  });
});
