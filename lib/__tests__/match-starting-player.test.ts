import { describe, expect, it } from 'vitest';
import { pickStartingPlayer } from '@/lib/match-starting-player';
import type { Participant } from '@/types/tournament';

const players: [Participant, Participant] = [
  { id: 'player-a', username: 'Alice' },
  { id: 'player-b', username: 'Bruno' },
];

describe('pickStartingPlayer', () => {
  it('restituisce lo stesso giocatore per lo stesso match', () => {
    const matchId = '40595ba6-fb12-4a10-ae1f-fbdd5bd4d136';
    expect(pickStartingPlayer(matchId, players)).toEqual(
      pickStartingPlayer(matchId, [...players] as [Participant, Participant]),
    );
  });

  it('restituisce sempre uno dei due partecipanti', () => {
    const winner = pickStartingPlayer('804b799f-799e-4961-96ae-b00afc0b138e', players);
    expect(players).toContainEqual(winner);
  });
});
