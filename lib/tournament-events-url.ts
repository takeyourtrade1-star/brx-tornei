import { publicConfig } from '@/lib/public-config';

/** WebSocket URL del canale di invalidazione autorevole del tavolo. */
export function getTournamentEventsWsUrl(tournamentId: string): string | null {
  const base = publicConfig.websocket.tournamentsOrigin;
  if (!base || !tournamentId) return null;

  const url = new URL(base);
  url.pathname = `/api/tournaments/tournament/${encodeURIComponent(tournamentId)}/events`;
  url.search = '';
  url.hash = '';
  return url.toString();
}
