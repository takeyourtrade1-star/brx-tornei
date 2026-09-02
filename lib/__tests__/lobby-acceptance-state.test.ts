import { describe, expect, it } from 'vitest';
import type { Tournament } from '@/types/tournament';
import { mergeTournamentWithHint, type TournamentRealtimeHint } from '@/lib/tournament-coordination';

function createMockTable(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 'test-table-1',
    format: 'modern',
    mode: 'heads-up',
    buyIn: 'for_fun',
    bestOf: 'BO3',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: [
      { id: 'player-1', username: 'GamerA', ready: true },
      { id: 'player-2', username: 'GamerB', ready: true },
    ],
    createdAt: '2026-08-17T10:00:00.000Z',
    updatedAt: '2026-08-17T10:00:00.000Z',
    ...overrides,
  };
}

describe('Lobby Acceptance State Transitions', () => {
  it('quando entrambi i giocatori accettano e arriva phase starting con matchId, il tavolo non perde i giocatori', () => {
    const table = createMockTable();
    const hint: TournamentRealtimeHint = {
      tournamentId: table.id,
      phase: 'starting',
      matchId: 'match-xyz',
      startsAt: '2026-08-17T10:00:05.000Z',
    };

    const merged = mergeTournamentWithHint(table, hint);
    expect(merged.phase).toBe('starting');
    expect(merged.matchId).toBe('match-xyz');
    expect(merged.participants.length).toBe(2);

    // Verifica che le proprietà corrispondano a uno stato "starting / live"
    const isStartingOrLive = Boolean(
      merged.status === 'iniziata' ||
      merged.phase === 'starting' ||
      merged.phase === 'live' ||
      merged.matchId,
    );
    expect(isStartingOrLive).toBe(true);
  });

  it('quando il match passa a status iniziata, viene riconosciuto come live', () => {
    const table = createMockTable({ status: 'iniziata', matchId: 'match-123' });
    const isStartingOrLive = Boolean(
      table.status === 'iniziata' ||
      table.phase === 'starting' ||
      table.phase === 'live' ||
      table.matchId,
    );
    expect(isStartingOrLive).toBe(true);
  });

  it('declined scatta solo se un giocatore si alza davvero mentre è ancora in_registrazione e non starting', () => {
    const tableWithOne = createMockTable({
      participants: [{ id: 'player-1', username: 'GamerA', ready: true }],
    });

    const isStartingOrLive = Boolean(
      tableWithOne.status === 'iniziata' ||
      tableWithOne.phase === 'starting' ||
      tableWithOne.phase === 'live' ||
      tableWithOne.matchId,
    );
    expect(isStartingOrLive).toBe(false);

    const wasFull = true;
    const opponentLeft = wasFull && tableWithOne.participants.length < tableWithOne.maxPlayers;
    expect(opponentLeft).toBe(true);
  });
});
