import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  isGapViewTicketExpired,
  newGapPeerPlaylistState,
  reduceGapPeerPlaylist,
  restartGapPeerPlaylist,
} from '@/lib/gap-recording/peer-review-playlist';

describe('gap peer-review playlist', () => {
  it('advances one fragment at a time and completes only after the last one', () => {
    const initial = newGapPeerPlaylistState('recording-1', 3);
    const second = reduceGapPeerPlaylist(initial, { type: 'ended' });
    const third = reduceGapPeerPlaylist(second, { type: 'ended' });
    const completed = reduceGapPeerPlaylist(third, { type: 'ended' });

    expect(second).toMatchObject({ currentIndex: 1, completed: false });
    expect(third).toMatchObject({ currentIndex: 2, completed: false });
    expect(completed).toMatchObject({ currentIndex: 2, completed: true });
  });

  it('never skips a failed fragment and retries the same index', () => {
    const second = reduceGapPeerPlaylist(
      newGapPeerPlaylistState('recording-1', 3),
      { type: 'ended' },
    );
    const failed = reduceGapPeerPlaylist(second, { type: 'failed' });

    expect(reduceGapPeerPlaylist(failed, { type: 'ended' })).toBe(failed);
    expect(reduceGapPeerPlaylist(failed, { type: 'retry' })).toMatchObject({
      currentIndex: 1,
      failed: false,
    });
  });

  it('resets index and errors when the recording changes', () => {
    const failed = reduceGapPeerPlaylist(
      newGapPeerPlaylistState('recording-1', 2),
      { type: 'failed' },
    );

    expect(reduceGapPeerPlaylist(failed, {
      type: 'reset', recordingId: 'recording-2', clipCount: 1,
    })).toEqual(newGapPeerPlaylistState('recording-2', 1));
  });

  it('can replay a completed single-fragment recording from the beginning', () => {
    const completed = reduceGapPeerPlaylist(
      newGapPeerPlaylistState('recording-1', 1),
      { type: 'ended' },
    );

    expect(completed).toMatchObject({ currentIndex: 0, completed: true });
    expect(reduceGapPeerPlaylist(completed, {
      type: 'reset', recordingId: 'recording-1', clipCount: 1,
    })).toEqual(newGapPeerPlaylistState('recording-1', 1));

    const reset = vi.fn();
    const replayCurrent = vi.fn();
    expect(restartGapPeerPlaylist(0, reset, replayCurrent)).toBe(false);
    expect(reset).toHaveBeenCalledOnce();
    expect(replayCurrent).toHaveBeenCalledOnce();
  });

  it('waits for the source change when replaying from a later fragment', () => {
    const reset = vi.fn();
    const replayCurrent = vi.fn();

    expect(restartGapPeerPlaylist(2, reset, replayCurrent)).toBe(true);
    expect(reset).toHaveBeenCalledOnce();
    expect(replayCurrent).not.toHaveBeenCalled();
  });

  it('renews invalid or nearly expired tickets without refreshing valid ones', () => {
    const now = Date.parse('2026-08-12T12:00:00Z');

    expect(isGapViewTicketExpired('2026-08-12T12:00:04Z', now)).toBe(true);
    expect(isGapViewTicketExpired('2026-08-12T12:00:06Z', now)).toBe(false);
    expect(isGapViewTicketExpired('not-a-date', now)).toBe(true);
  });

  it('renders one video player instead of one element per technical fragment', () => {
    const player = readFileSync(
      new URL(
        '../../components/feature/tornei/match/match-gap-video-playlist.tsx',
        import.meta.url,
      ),
      'utf8',
    );
    const review = readFileSync(
      new URL(
        '../../components/feature/tornei/match/match-gap-peer-review.tsx',
        import.meta.url,
      ),
      'utf8',
    );

    expect(player.match(/<video\b/g)).toHaveLength(1);
    expect(player).toContain('onEnded={advance}');
    expect(review).toContain('<MatchGapVideoPlaylist');
    expect(review).not.toContain('loaded?.map');
  });
});
