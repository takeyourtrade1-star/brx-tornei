import { describe, expect, it } from 'vitest';
import {
  mergeTournamentWithHint,
  parseTournamentRealtimeHint,
} from '@/lib/tournament-coordination';
import type { Tournament } from '@/types/tournament';

const tournamentId = 'tournament-1';

function baseTournament(): Tournament {
  return {
    id: tournamentId,
    format: 'modern',
    mode: 'heads-up',
    buyIn: 'for_fun',
    bestOf: 'BO3',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [
      { id: 'player-1', username: 'Uno', ready: false },
    ],
    createdAt: '2026-08-17T09:59:00.000Z',
    updatedAt: '2026-08-17T10:00:00.000Z',
    readyDeadline: '2026-08-17T10:00:32.000Z',
    acceptanceOpensAt: '2026-08-17T10:00:02.000Z',
    serverTime: '2026-08-17T10:00:00.000Z',
  };
}

describe('coordinamento realtime del tavolo', () => {
  it('riduce l’evento a una timeline e ai partecipanti sicuri', () => {
    const hint = parseTournamentRealtimeHint(
      {
        event: 'tournament-state-changed',
        tournament_id: tournamentId,
        phase: 'accepting',
        phase_version: '2026-08-17T10:00:00.000Z',
        acceptance_opens_at: '2026-08-17T10:00:02.000Z',
        ready_deadline: '2026-08-17T10:00:32.000Z',
        server_time: 1_755_000_000_000,
        participants: [
          { id: 'player-1', username: 'Uno', ready: false, secret: 'ignored' },
          { id: 'player-2', username: 'Due', ready: true },
        ],
      },
      tournamentId,
    );

    expect(hint).toMatchObject({
      tournamentId,
      phase: 'accepting',
      acceptanceOpensAt: '2026-08-17T10:00:02.000Z',
      readyDeadline: '2026-08-17T10:00:32.000Z',
    });
    expect(hint?.participants).toEqual([
      { id: 'player-1', username: 'Uno', ready: false },
      { id: 'player-2', username: 'Due', ready: true },
    ]);
  });

  it('applica i valori nulli dell’evento per eliminare la vecchia fase', () => {
    const hint = parseTournamentRealtimeHint(
      {
        event: 'tournament-state-changed',
        tournament_id: tournamentId,
        phase: 'starting',
        phase_version: '2026-08-17T10:00:03.000Z',
        phase_started_at: '2026-08-17T10:00:03.000Z',
        acceptance_opens_at: null,
        ready_deadline: null,
        starts_at: '2026-08-17T10:00:08.000Z',
        match_id: 'match-1',
        server_time: '2026-08-17T10:00:03.000Z',
        participants: [],
      },
      tournamentId,
    );

    const merged = mergeTournamentWithHint(baseTournament(), hint ?? undefined);
    expect(merged.phase).toBe('starting');
    expect(merged.readyDeadline).toBeUndefined();
    expect(merged.acceptanceOpensAt).toBeUndefined();
    expect(merged.startsAt).toBe('2026-08-17T10:00:08.000Z');
    expect(merged.matchId).toBe('match-1');
    expect(merged.participants).toEqual([]);
  });
});
