import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/tournament-api-client', () => ({
  tournamentFetch: vi.fn(),
  extractApiError: vi.fn(),
  TournamentApiError: class TournamentApiError extends Error {},
}));

import {
  friendRequestSchema,
  searchPlayersSchema,
  sendGameChallengeSchema,
} from '@/lib/validations/social';
import { mapPresence } from '@/lib/data/social-mock-store';

describe('Social Validations & Privacy Bucketing', () => {
  it('valida la ricerca di giocatori correttamente', () => {
    expect(searchPlayersSchema.safeParse({ query: 'Al' }).success).toBe(true);
    expect(searchPlayersSchema.safeParse({ query: 'A' }).success).toBe(false);
    expect(searchPlayersSchema.safeParse({ query: 'Alex_TCG' }).success).toBe(true);
    expect(searchPlayersSchema.safeParse({ query: 'Invalid<script>' }).success).toBe(false);
  });

  it('valida le richieste di amicizia su gamertag leciti', () => {
    expect(friendRequestSchema.safeParse({ gamertag: 'Alex99' }).success).toBe(true);
    expect(friendRequestSchema.safeParse({ gamertag: 'ab' }).success).toBe(false);
    expect(friendRequestSchema.safeParse({ gamertag: 'invalid name with space' }).success).toBe(false);
  });

  it('valida i parametri di una sfida diretta', () => {
    expect(
      sendGameChallengeSchema.safeParse({
        targetGamertag: 'Kurogane',
        format: 'modern',
        bestOf: 'BO3',
      }).success,
    ).toBe(true);

    expect(
      sendGameChallengeSchema.safeParse({
        targetGamertag: 'Kurogane',
        format: 'invalid_format',
        bestOf: 'BO3',
      }).success,
    ).toBe(false);
  });

  it('preserva la privacy senza timestamp esatti e bucketa <48h come "recent"', () => {
    // In partita
    expect(mapPresence(2, true)).toBe('in_game');
    // Online ora (entro 5 minuti)
    expect(mapPresence(3, false)).toBe('online');
    // Attivo di recente (< 48 ore)
    expect(mapPresence(120, false)).toBe('recent');
    expect(mapPresence(47 * 60, false)).toBe('recent');
    // Offline (> 48 ore)
    expect(mapPresence(49 * 60, false)).toBe('offline');
    expect(mapPresence(10000, false)).toBe('offline');
  });
});
