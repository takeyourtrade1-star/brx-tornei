import { describe, expect, it } from 'vitest';
import { mapTournamentFromApi } from '@/lib/data/tournament-mapper';

const base = {
  id: 't-1',
  format: 'modern',
  mode: 'heads-up',
  created_at: '2026-07-20T10:00:00+00:00',
  participants: [],
};

describe('tournament mapper activity timestamp', () => {
  it('maps the authoritative updated_at timestamp', () => {
    const tournament = mapTournamentFromApi({
      ...base,
      updated_at: '2026-07-22T09:59:00+00:00',
    });

    expect(tournament?.updatedAt).toBe('2026-07-22T09:59:00+00:00');
  });

  it('falls back to created_at during a rolling backend deploy', () => {
    const tournament = mapTournamentFromApi(base);

    expect(tournament?.updatedAt).toBe(base.created_at);
  });
});

describe('tournament mapper disconnessione/abbandono (Requisiti 3+4)', () => {
  it('maps the disconnect countdown fields when a peer is flagged as lost', () => {
    const tournament = mapTournamentFromApi({
      ...base,
      match_status: 'ongoing',
      disconnected_user_id: 'user-2',
      grace_deadline: '2026-07-22T10:01:30+00:00',
    });

    expect(tournament?.matchStatus).toBe('ongoing');
    expect(tournament?.disconnectedUserId).toBe('user-2');
    expect(tournament?.graceDeadline).toBe('2026-07-22T10:01:30+00:00');
  });

  it('maps a settled abandonment outcome', () => {
    const tournament = mapTournamentFromApi({
      ...base,
      match_status: 'finished',
      end_reason: 'timeout',
      winner_user_id: 'user-1',
      result_status: 'settled',
    });

    expect(tournament?.matchStatus).toBe('finished');
    expect(tournament?.endReason).toBe('timeout');
    expect(tournament?.winnerUserId).toBe('user-1');
    expect(tournament?.resultStatus).toBe('settled');
  });

  it('drops an unrecognized end_reason instead of passing it through', () => {
    const tournament = mapTournamentFromApi({ ...base, end_reason: 'not-a-real-reason' });

    expect(tournament?.endReason).toBeUndefined();
  });

  it('leaves the new fields undefined when the backend omits them', () => {
    const tournament = mapTournamentFromApi(base);

    expect(tournament?.matchStatus).toBeUndefined();
    expect(tournament?.endReason).toBeUndefined();
    expect(tournament?.winnerUserId).toBeUndefined();
    expect(tournament?.disconnectedUserId).toBeUndefined();
    expect(tournament?.graceDeadline).toBeUndefined();
    expect(tournament?.resultStatus).toBeUndefined();
    expect(tournament?.resultClaimDeadline).toBeUndefined();
  });
});

describe('tournament mapper dichiarazione risultato (Requisito 2)', () => {
  it('maps the claimed-result fields once a player declares', () => {
    const tournament = mapTournamentFromApi({
      ...base,
      match_status: 'finished',
      result_status: 'claimed',
      result_claimed_by: 'user-1',
      result_claimed_winner: 'user-1',
      result_claim_deadline: '2026-07-22T10:00:45+00:00',
    });

    expect(tournament?.matchStatus).toBe('finished');
    expect(tournament?.resultStatus).toBe('claimed');
    expect(tournament?.resultClaimedBy).toBe('user-1');
    expect(tournament?.resultClaimedWinner).toBe('user-1');
    expect(tournament?.resultClaimDeadline).toBe('2026-07-22T10:00:45+00:00');
  });

  it('maps a disputed outcome with no winner', () => {
    const tournament = mapTournamentFromApi({
      ...base,
      match_status: 'finished',
      end_reason: 'disputed',
      result_status: 'settled',
    });

    expect(tournament?.endReason).toBe('disputed');
    expect(tournament?.winnerUserId).toBeUndefined();
  });

  it('leaves the claim fields undefined when the backend omits them', () => {
    const tournament = mapTournamentFromApi(base);

    expect(tournament?.resultClaimedBy).toBeUndefined();
    expect(tournament?.resultClaimedWinner).toBeUndefined();
  });
});
