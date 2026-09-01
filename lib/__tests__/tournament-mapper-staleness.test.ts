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

  it('maps the server clock and synchronized match deadlines', () => {
    const tournament = mapTournamentFromApi({
      ...base,
      server_time: '2026-08-17T10:00:00+00:00',
      phase: 'accepting',
      phase_version: '2026-08-17T10:00:00+00:00',
      phase_started_at: '2026-08-17T10:00:02+00:00',
      acceptance_opens_at: '2026-08-17T10:00:02+00:00',
      ready_deadline: '2026-08-17T10:00:30+00:00',
      starts_at: '2026-08-17T10:00:45+00:00',
    });

    expect(tournament?.serverTime).toBe('2026-08-17T10:00:00+00:00');
    expect(tournament?.phase).toBe('accepting');
    expect(tournament?.phaseVersion).toBe('2026-08-17T10:00:00+00:00');
    expect(tournament?.phaseStartedAt).toBe('2026-08-17T10:00:02+00:00');
    expect(tournament?.acceptanceOpensAt).toBe('2026-08-17T10:00:02+00:00');
    expect(tournament?.readyDeadline).toBe('2026-08-17T10:00:30+00:00');
    expect(tournament?.startsAt).toBe('2026-08-17T10:00:45+00:00');
  });

  it('falls back to created_at during a rolling backend deploy', () => {
    const tournament = mapTournamentFromApi(base);

    expect(tournament?.updatedAt).toBe(base.created_at);
  });
});

describe('tournament mapper stato P2P e cleanup neutro', () => {
  it('maps the local reconnect expiry fields', () => {
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

  it('maps a neutral stale-table closure without inventing a winner', () => {
    const tournament = mapTournamentFromApi({
      ...base,
      match_status: 'finished',
      end_reason: 'timeout',
      result_status: 'settled',
    });

    expect(tournament?.matchStatus).toBe('finished');
    expect(tournament?.endReason).toBe('timeout');
    expect(tournament?.winnerUserId).toBeUndefined();
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

describe('tournament mapper dichiarazione risultato concorde', () => {
  it('maps the claimed-result fields once a player declares', () => {
    const tournament = mapTournamentFromApi({
      ...base,
      match_status: 'ongoing',
      result_status: 'claimed',
      result_claimed_by: 'user-1',
      result_claimed_winner: 'user-1',
      result_claim_deadline: '2026-07-22T10:00:45+00:00',
      player_scores: { 'user-1': 2, 'user-2': 1 },
    });

    expect(tournament?.matchStatus).toBe('ongoing');
    expect(tournament?.resultStatus).toBe('claimed');
    expect(tournament?.resultClaimedBy).toBe('user-1');
    expect(tournament?.resultClaimedWinner).toBe('user-1');
    expect(tournament?.resultClaimDeadline).toBe('2026-07-22T10:00:45+00:00');
    expect(tournament?.scoreByPlayerId).toEqual({ 'user-1': 2, 'user-2': 1 });
  });

  it('keeps legacy disputed outcomes readable without a winner', () => {
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
