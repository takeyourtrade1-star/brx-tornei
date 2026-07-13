import type { Participant } from '@/types/tournament';

/** Sorteggio deterministico sull'UUID casuale del match: identico sui due client. */
export function pickStartingPlayer(
  matchId: string,
  players: [Participant, Participant],
): Participant {
  let hash = 2166136261;
  for (let index = 0; index < matchId.length; index += 1) {
    hash ^= matchId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return players[(hash >>> 0) % players.length] ?? players[0];
}
