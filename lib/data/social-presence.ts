import type { FriendPresenceStatus } from '@/types/social';

/** Mappa last-seen in bucket privacy-preserving: zero timestamp precisi. */
export function mapPresence(
  lastSeenMinutesAgo?: number,
  inGame?: boolean,
  isDnd?: boolean,
): FriendPresenceStatus {
  if (isDnd) return 'dnd';
  if (inGame) return 'in_game';
  if (typeof lastSeenMinutesAgo !== 'number') return 'offline';
  if (lastSeenMinutesAgo <= 5) return 'online';
  if (lastSeenMinutesAgo <= 48 * 60) return 'recent';
  return 'offline';
}

export function presenceStatusText(presence: FriendPresenceStatus): string {
  switch (presence) {
    case 'dnd':
      return 'Non disturbare (Occupato)';
    case 'online':
      return 'Online adesso';
    case 'in_game':
      return 'In partita';
    case 'recent':
      return 'Attivo di recente';
    case 'offline':
      return 'Non attivo di recente';
  }
}
