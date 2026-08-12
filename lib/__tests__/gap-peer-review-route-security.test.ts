import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ mutation: vi.fn(), query: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({
  config: { app: { siteUrl: 'https://tornei.ebartex.com' } },
}));
vi.mock('@/lib/gap-recording/bff-proxy', () => ({
  proxyGapRecordingMutation: mocks.mutation,
  proxyGapRecordingQuery: mocks.query,
}));

import { GET as list } from '../../app/api/tournaments/match/[matchId]/gap-recordings/peer-review/route';
import {
  GET as detail,
  POST as review,
} from '../../app/api/tournaments/match/[matchId]/gap-recordings/[recordingId]/peer-review/route';
import { POST as notice } from '../../app/api/tournaments/match/[matchId]/gap-recordings/[recordingId]/peer-review/notice/route';
import { POST as ticket } from '../../app/api/tournaments/match/[matchId]/gap-recordings/[recordingId]/clips/[clipId]/view-ticket/route';
import { POST as tickets } from '../../app/api/tournaments/match/[matchId]/gap-recordings/[recordingId]/clips/view-tickets/route';

const MATCH_ID = '6f069abc-a25d-4e99-b63c-473b507021af';
const RECORDING_ID = 'd19d2244-05d9-4308-9901-5d5593f0802c';
const CLIP_ID = '9ae60030-3c6b-46a7-8e30-45eab3e959e6';

function mutationRequest(body?: unknown, origin = 'https://tornei.ebartex.com') {
  return new Request('https://tornei.ebartex.com/api/tournaments/match/review', {
    method: 'POST',
    headers: {
      Origin: origin,
      'Sec-Fetch-Site': origin.includes('attacker') ? 'cross-site' : 'same-origin',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('player gap-review BFF boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockResolvedValue(Response.json({ data: [] }));
    mocks.mutation.mockResolvedValue(Response.json({ data: {} }));
  });

  it('uses only the fixed authenticated list and detail paths', async () => {
    await list(new Request('https://tornei.ebartex.com'), {
      params: Promise.resolve({ matchId: MATCH_ID }),
    });
    await detail(new Request('https://tornei.ebartex.com'), {
      params: Promise.resolve({ matchId: MATCH_ID, recordingId: RECORDING_ID }),
    });
    expect(mocks.query).toHaveBeenNthCalledWith(
      1,
      `/api/v1/matches/${MATCH_ID}/gap-recordings/peer-review`,
    );
    expect(mocks.query).toHaveBeenNthCalledWith(
      2,
      `/api/v1/matches/${MATCH_ID}/gap-recordings/${RECORDING_ID}/peer-review`,
    );
  });

  it('rejects cross-site or invalid review commands before proxying', async () => {
    const context = { params: Promise.resolve({ matchId: MATCH_ID, recordingId: RECORDING_ID }) };
    expect((await review(mutationRequest({}, 'https://attacker.example'), context)).status).toBe(403);
    expect((await review(mutationRequest({ decision: 'verified' }), context)).status).toBe(400);
    expect((await tickets(mutationRequest(undefined, 'https://attacker.example'), context)).status).toBe(403);
    expect((await tickets(mutationRequest(), {
      params: Promise.resolve({ matchId: 'not-a-uuid', recordingId: RECORDING_ID }),
    })).status).toBe(400);
    expect(mocks.mutation).not.toHaveBeenCalled();
  });

  it('binds notice, ticket and review to exact resource paths', async () => {
    const recordingContext = {
      params: Promise.resolve({ matchId: MATCH_ID, recordingId: RECORDING_ID }),
    };
    await notice(mutationRequest(), recordingContext);
    await ticket(mutationRequest(), {
      params: Promise.resolve({ matchId: MATCH_ID, recordingId: RECORDING_ID, clipId: CLIP_ID }),
    });
    await tickets(mutationRequest(), recordingContext);
    await review(mutationRequest({
      decision: 'verified',
      reason_code: 'gap_consistent',
      notice_version: 'peer-gap-review-v1',
      notice_acknowledged: true,
    }), recordingContext);
    expect(mocks.mutation).toHaveBeenNthCalledWith(
      1,
      `/api/v1/matches/${MATCH_ID}/gap-recordings/${RECORDING_ID}/peer-review/notice`,
      { notice_version: 'peer-gap-review-v1', temporary_storage_acknowledged: true },
    );
    expect(mocks.mutation).toHaveBeenNthCalledWith(
      2,
      `/api/v1/matches/${MATCH_ID}/gap-recordings/${RECORDING_ID}/clips/${CLIP_ID}/view-ticket`,
    );
    expect(mocks.mutation).toHaveBeenNthCalledWith(
      3,
      `/api/v1/matches/${MATCH_ID}/gap-recordings/${RECORDING_ID}/clips/view-tickets`,
    );
    expect(mocks.mutation).toHaveBeenNthCalledWith(
      4,
      `/api/v1/matches/${MATCH_ID}/gap-recordings/${RECORDING_ID}/peer-review`,
      {
        decision: 'verified',
        reason_code: 'gap_consistent',
        notice_version: 'peer-gap-review-v1',
        notice_acknowledged: true,
      },
    );
  });
});
