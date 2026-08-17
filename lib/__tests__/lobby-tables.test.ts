import { describe, expect, it } from 'vitest';
import { buildLobbyTables } from '@/lib/lobby';
import type { Tournament } from '@/types/tournament';

function table(id: string, participantIds: string[], withFriend = true): Tournament {
  return {
    id,
    format: 'modern',
    mode: 'heads-up',
    buyIn: 'for_fun',
    bestOf: 'BO3',
    status: 'in_registrazione',
    maxPlayers: 2,
    participants: participantIds.map((participantId) => ({
      id: participantId,
      username: participantId,
    })),
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z',
    withFriend,
  };
}

describe('buildLobbyTables', () => {
  it('mostra sempre un tavolo libero in cima anche quando sono seduto a un mio tavolo', () => {
    const result = buildLobbyTables({
      tournaments: [table('mine', ['me']), table('other', ['friend'])],
      userId: 'me',
    });
    expect(result.map((item) => [item.key, item.kind])).toEqual([
      ['__empty-0', 'empty'],
      ['mine', 'mine'],
      ['other', 'joinable'],
    ]);
  });

  it('filtra i tavoli altrui per formato selezionato', () => {
    const result = buildLobbyTables({
      tournaments: [
        { ...table('modern-t', ['a']), format: 'modern' },
        { ...table('legacy-t', ['b']), format: 'legacy' },
      ],
      userId: 'me',
      format: 'modern',
    });
    expect(result.map((item) => [item.key, item.kind])).toEqual([
      ['__empty-0', 'empty'],
      ['modern-t', 'joinable'],
    ]);
  });

  it('mostra il mio tavolo anche se è in un altro formato con tavolo libero in cima', () => {
    const result = buildLobbyTables({
      tournaments: [{ ...table('mine', ['me']), format: 'legacy' }],
      userId: 'me',
      format: 'modern',
    });
    expect(result.map((item) => [item.key, item.kind])).toEqual([
      ['__empty-0', 'empty'],
      ['mine', 'mine'],
    ]);
  });
});
