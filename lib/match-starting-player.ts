import type { Participant } from '@/types/tournament';

/**
 * Sorteggio deterministico sul matchId (UUID casuale): identico su entrambi
 * i client e coerente tra reload. Una partita iniziata non ri-sorteggia: qui
 * si decide solo chi parte all'avvio.
 */
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

const INTRO_SEEN_PREFIX = 'match-intro:';

/** Ha già visto la cerimonia di inizio per questo match (browser)? */
export function hasSeenMatchIntro(matchId: string): boolean {
  try {
    return window.localStorage.getItem(`${INTRO_SEEN_PREFIX}${matchId}`) === '1';
  } catch {
    return false;
  }
}

export function markMatchIntroSeen(matchId: string): void {
  try {
    window.localStorage.setItem(`${INTRO_SEEN_PREFIX}${matchId}`, '1');
  } catch {
    /* storage non disponibile */
  }
}
