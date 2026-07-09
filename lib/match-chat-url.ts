/** WebSocket URL for ephemeral match chat on the Tournament Service. */
export function getMatchChatWsUrl(matchId: string): string | null {
  const base = process.env.NEXT_PUBLIC_TOURNAMENTS_API_URL?.trim();
  if (!base || !matchId) return null;

  const url = new URL(base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `/api/tournaments/match/${encodeURIComponent(matchId)}/chat`;
  url.search = '';
  url.hash = '';
  return url.toString();
}
