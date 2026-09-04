import { publicConfig } from '@/lib/public-config';

const SOCIAL_ROOM_WS_PATH = '/api/tournaments/social-room';

/**
 * URL browser-safe del WebSocket persistente della Sala Piazza.
 *
 * L'origine e l'endpoint sono fissi: nessun identificativo fornito dal client
 * può trasformare questa funzione in un proxy verso una destinazione diversa.
 */
export function getSocialRoomWsUrl(): string | null {
  const configuredOrigin = publicConfig.websocket.tournamentsOrigin;
  if (!configuredOrigin) return null;

  try {
    const url = new URL(configuredOrigin);
    if (url.protocol === 'https:') url.protocol = 'wss:';
    else if (url.protocol === 'http:') url.protocol = 'ws:';
    if (url.protocol !== 'ws:' && url.protocol !== 'wss:') return null;
    url.pathname = SOCIAL_ROOM_WS_PATH;
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}
