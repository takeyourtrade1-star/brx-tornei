import { publicConfig } from '@/lib/public-config';

/** WebSocket URL for ephemeral match chat on the Tournament Service. */
export function getMatchChatWsUrl(matchId: string): string | null {
  const base = publicConfig.websocket.tournamentsOrigin;
  if (!base || !matchId) return null;

  const url = new URL(base);
  url.pathname = `/api/tournaments/match/${encodeURIComponent(matchId)}/chat`;
  url.search = '';
  url.hash = '';
  return url.toString();
}
