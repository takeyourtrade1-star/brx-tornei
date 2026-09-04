import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadUrlHelper() {
  vi.resetModules();
  return import('@/lib/social-room-url');
}

describe('URL WebSocket Sala Piazza', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('costruisce l endpoint fisso sull origine WSS configurata', async () => {
    vi.stubEnv('NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN', 'wss://api-tornei.ebartex.com');
    const { getSocialRoomWsUrl } = await loadUrlHelper();

    expect(getSocialRoomWsUrl()).toBe('wss://api-tornei.ebartex.com/api/tournaments/social-room');
  });

  it('converte un origine HTTP locale in WS e scarta la configurazione vuota', async () => {
    vi.stubEnv('NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN', 'http://127.0.0.1:8002');
    const { getSocialRoomWsUrl } = await loadUrlHelper();
    expect(getSocialRoomWsUrl()).toBe('ws://127.0.0.1:8002/api/tournaments/social-room');

    vi.stubEnv('NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN', '');
    const empty = await loadUrlHelper();
    expect(empty.getSocialRoomWsUrl()).toBeNull();
  });

  it('non conserva query, fragment o un percorso forniti dalla configurazione', async () => {
    vi.stubEnv('NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN', 'wss://api-tornei.ebartex.com/unsafe');
    const { getSocialRoomWsUrl } = await loadUrlHelper();
    expect(getSocialRoomWsUrl()).toBeNull();
  });
});
