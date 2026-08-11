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
  it('mantiene visibili le altre sfide P2P quando ho già creato un tavolo', () => {
    const result = buildLobbyTables({
      tournaments: [table('mine', ['me']), table('other', ['friend'])],
      userId: 'me',
    });
    expect(result.map((item) => [item.key, item.kind])).toEqual([
      ['mine', 'mine'],
      ['other', 'joinable'],
    ]);
  });

  it('non propone tavoli normali e non mostra un secondo tasto crea se sono seduto', () => {
    const result = buildLobbyTables({
      tournaments: [table('mine', ['me']), table('legacy', ['player'], false)],
      userId: 'me',
    });
    expect(result.map((item) => item.key)).toEqual(['mine']);
    expect(result.some((item) => item.kind === 'empty')).toBe(false);
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

  it('mostra il mio tavolo anche se è in un altro formato', () => {
    const result = buildLobbyTables({
      tournaments: [{ ...table('mine', ['me']), format: 'legacy' }],
      userId: 'me',
      format: 'modern',
    });
    expect(result.map((item) => [item.key, item.kind])).toEqual([['mine', 'mine']]);
  });
});
