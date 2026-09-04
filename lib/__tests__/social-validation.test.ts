import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/tournament-api-client', () => ({
  tournamentFetch: vi.fn(),
  extractApiError: vi.fn(),
  TournamentApiError: class TournamentApiError extends Error {},
}));

import {
  friendRequestSchema,
  removeFriendSchema,
  respondFriendRequestSchema,
  respondGameChallengeSchema,
  searchPlayersSchema,
  sendGameChallengeSchema,
} from '@/lib/validations/social';
import {
  buildFallbackPublicProfile,
  getAvatarIdForGamertag,
} from '@/lib/data/social-mock-store';
import { mapPresence, presenceStatusText } from '@/lib/data/social-presence';

describe('Social Validations, Scalability & Privacy Bucketing', () => {
  it('valida la ricerca di giocatori con limiti corretti', () => {
    expect(searchPlayersSchema.safeParse({ query: 'Al' }).success).toBe(true);
    expect(searchPlayersSchema.safeParse({ query: 'A' }).success).toBe(false);
    expect(searchPlayersSchema.safeParse({ query: 'Alex_TCG' }).success).toBe(true);
    expect(searchPlayersSchema.safeParse({ query: 'Invalid<script>' }).success).toBe(false);
    expect(searchPlayersSchema.safeParse({ query: 'a'.repeat(35) }).success).toBe(false);
  });

  it('valida le richieste di amicizia e rimozione su gamertag leciti', () => {
    expect(friendRequestSchema.safeParse({ gamertag: 'Alex99' }).success).toBe(true);
    expect(friendRequestSchema.safeParse({ gamertag: 'ab' }).success).toBe(false);
    expect(friendRequestSchema.safeParse({ gamertag: 'invalid name with space' }).success).toBe(false);
    expect(removeFriendSchema.safeParse({ gamertag: 'Kurogane' }).success).toBe(true);
    expect(removeFriendSchema.safeParse({ gamertag: 'ab' }).success).toBe(false);
  });

  it('valida le risposte a richieste e sfide', () => {
    expect(respondFriendRequestSchema.safeParse({ requestId: 'r-1', action: 'accept' }).success).toBe(true);
    expect(respondFriendRequestSchema.safeParse({ requestId: 'r-1', action: 'decline' }).success).toBe(true);
    expect(respondFriendRequestSchema.safeParse({ requestId: 'r-1', action: 'invalid' }).success).toBe(false);

    expect(respondGameChallengeSchema.safeParse({ challengeId: 'ch-1', action: 'accept' }).success).toBe(true);
    expect(respondGameChallengeSchema.safeParse({
      challengeId: 'ch-1', action: 'accept', deckId: 'deck-1',
    }).success).toBe(true);
    expect(respondGameChallengeSchema.safeParse({ challengeId: 'ch-1', action: 'decline' }).success).toBe(true);
  });

  it('valida i parametri di una sfida diretta', () => {
    expect(
      sendGameChallengeSchema.safeParse({
        targetGamertag: 'Kurogane',
        format: 'modern',
        bestOf: 'BO3',
        deckId: 'deck-1',
      }).success,
    ).toBe(true);

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
        deckId: 'deck-1',
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
    // Last-seen assente: offline, mai online di default
    expect(mapPresence(undefined, false)).toBe('offline');
    expect(mapPresence()).toBe('offline');
    expect(presenceStatusText('offline')).toBe('Non attivo di recente');
  });

  it('assegna avatar deterministici e profili pubblici senza esporre dati sensibili', () => {
    const avatar1 = getAvatarIdForGamertag('PlayerOne');
    const avatar2 = getAvatarIdForGamertag('PlayerOne');
    expect(avatar1).toBe(avatar2);

    const profile = buildFallbackPublicProfile('TestOpponent', 'MyGamertag');
    expect(profile.gamertag).toBe('TestOpponent');
    expect(profile.stats.played).toBeGreaterThanOrEqual(0);
    expect(profile.stats.wins).toBeGreaterThanOrEqual(0);
    expect(profile.honorBadges.friendly).toBeGreaterThanOrEqual(0);
    expect(profile.ebartexUsername).toBeNull();

    expect(
      buildFallbackPublicProfile('MyGamertag', 'MyGamertag', 'my_ebartex_username').ebartexUsername,
    ).toBe('my_ebartex_username');
    // Verifica che non esistano campi sensibili esposti
    expect('email' in profile).toBe(false);
    expect('token' in profile).toBe(false);
  });
});
