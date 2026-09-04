import { describe, expect, it } from 'vitest';
import type { Tournament } from '@/types/tournament';
import { getWorldActivity } from '@/minigioco-test/world-client/world-activity';

function table(patch: Partial<Tournament> = {}): Tournament {
  return {
    id: 't1', format: 'modern', mode: 'heads-up', buyIn: 'for_fun', bestOf: 'BO3',
    status: 'in_registrazione', maxPlayers: 2,
    participants: [{ id: 'u1', username: 'Io' }, { id: 'u2', username: 'Amico' }],
    createdAt: '2026-09-04T09:00:00Z', updatedAt: '2026-09-04T09:00:00Z', ...patch,
  };
}

describe('attività ufficiale nel mondo Asso', () => {
  it('non inventa risultati o countdown per tavoli senza scadenza', () => {
    expect(getWorldActivity([], 'Io')).toEqual({
      stats: { giocati: 0, vinti: 0 }, opponent: null, countdown: null, bracket: false,
    });
    expect(getWorldActivity([table()], 'Io').countdown).toBeNull();
    expect(getWorldActivity([table({ startsAt: 'non valida' })], 'Io').countdown).toBeNull();
  });
  it('conta soltanto esiti conclusi che identificano un vincitore', () => {
    const tournaments = [
      table({ id: 'vinta', status: 'terminata', winnerUserId: 'u1' }),
      table({ id: 'persa', status: 'terminata', winnerUserId: 'u2' }),
      table({ id: 'annullata', status: 'terminata' }),
      table({ id: 'in-corso', winnerUserId: 'u1' }),
    ];
    expect(getWorldActivity(tournaments, 'Io').stats).toEqual({ giocati: 2, vinti: 1 });
  });
  it('usa la scadenza condivisa e ignora i tavoli degli altri giocatori', () => {
    const startsAt = '2026-09-04T10:00:00Z';
    expect(getWorldActivity([table({ startsAt })], 'Io').countdown).toBe(Date.parse(startsAt));
    expect(getWorldActivity([table({ startsAt })], 'Estraneo').countdown).toBeNull();
  });
});
