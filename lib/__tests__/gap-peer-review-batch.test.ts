import { describe, expect, it, vi } from 'vitest';
import { loadGapPeerClipViews } from '@/lib/gap-recording/peer-review-tickets';
import type { GapPeerDetail } from '@/lib/validations/gap-recording';

vi.mock('@/lib/public-config', () => ({
  publicConfig: {
    storage: {
      matchGapUploadOrigin:
        'https://tournaments-000876600482-eu-south-1-match-gaps.s3.eu-south-1.amazonaws.com',
    },
  },
}));

const origin =
  'https://tournaments-000876600482-eu-south-1-match-gaps.s3.eu-south-1.amazonaws.com';

function clip(index: number): GapPeerDetail['clips'][number] {
  const suffix = index.toString(16).padStart(12, '0');
  return {
    clip_id: `9ae60030-3c6b-46a7-8e30-${suffix}`,
    sequence: index,
    started_at: '2026-08-12T12:00:00Z',
    ended_at: '2026-08-12T12:00:05Z',
    content_type: 'video/webm',
    byte_length: 1_000 + index,
  };
}

function responseFor(clips: GapPeerDetail['clips']) {
  return Response.json({ data: { tickets: clips.map((item) => ({
    clip_id: item.clip_id,
    url: `${origin}/match-gaps/video-${item.sequence}.webm?signature=test`,
    content_type: item.content_type,
    byte_length: item.byte_length,
    expires_at: '2026-08-12T12:05:00Z',
  })) } });
}

describe('gap peer-review batch capabilities', () => {
  it('loads the maximum 32 clips with one authenticated mutation', async () => {
    const clips = Array.from({ length: 32 }, (_, index) => clip(index));
    const request = vi.fn(async () => responseFor(clips));

    const views = await loadGapPeerClipViews('/api/tournaments/match/m/recording/r', clips, request);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      '/api/tournaments/match/m/recording/r/clips/view-tickets',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
    expect(views).toHaveLength(32);
    expect(views.map((view) => view.sequence)).toEqual(Array.from({ length: 32 }, (_, i) => i));
  });

  it('rejects incomplete or mismatched capability batches', async () => {
    const clips = [clip(0), clip(1)];
    await expect(loadGapPeerClipViews(
      '/review',
      clips,
      vi.fn(async () => responseFor(clips.slice(0, 1))),
    )).rejects.toThrow('Capability video incomplete');

    const mismatched = responseFor(clips);
    const body = await mismatched.json() as { data: { tickets: Array<{ byte_length: number }> } };
    body.data.tickets[0].byte_length += 1;
    await expect(loadGapPeerClipViews(
      '/review',
      clips,
      vi.fn(async () => Response.json(body)),
    )).rejects.toThrow('Capability video non coerente');
  });

  it('orders clips by sequence even when the detail response is shuffled', async () => {
    const clips = [clip(2), clip(0), clip(1)];

    const views = await loadGapPeerClipViews(
      '/review',
      clips,
      vi.fn(async () => responseFor(clips)),
    );

    expect(views.map((view) => view.sequence)).toEqual([0, 1, 2]);
  });
});
