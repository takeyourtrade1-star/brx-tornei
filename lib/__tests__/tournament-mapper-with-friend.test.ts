import { describe, expect, it } from 'vitest';
import { mapTournamentFromApi } from '@/lib/data/tournament-mapper';

const baseTournament = {
  id: 'tournament-1',
  format: 'modern',
  mode: 'heads-up',
  created_at: '2026-07-13T08:00:00Z',
  participants: [],
};

describe('mapTournamentFromApi with_friend', () => {
  it('propaga il consenso P2P dal backend', () => {
    expect(mapTournamentFromApi({ ...baseTournament, with_friend: true })?.withFriend).toBe(true);
  });

  it('usa la modalità protetta per default', () => {
    expect(mapTournamentFromApi(baseTournament)?.withFriend).toBe(false);
  });

  it('mappa qualità connessione e secondo giro risultato', () => {
    const mapped = mapTournamentFromApi({
      ...baseTournament,
      result_round: 2,
      result_reselection_required: true,
      participants: [
        {
          id: 'player-1',
          username: 'Nick',
          connection: {
            level: 'fair',
            rtt_ms: 182,
            packet_loss_pct: 1.7,
            transport: 'relay',
            poor_samples: 2,
          },
        },
      ],
    });
    expect(mapped?.participants[0]?.connection).toMatchObject({
      level: 'fair',
      rttMs: 182,
      packetLossPct: 1.7,
      transport: 'relay',
      poorSamples: 2,
    });
    expect(mapped?.resultRound).toBe(2);
    expect(mapped?.resultReselectionRequired).toBe(true);
  });
});
