import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';
import {
  expiredGapIncidentIds,
  isGapIncidentExpired,
  startGapRetentionPurge,
} from '@/lib/gap-recording/retention';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('gap recording local retention', () => {
  it('expires by creation time even when a recent retry updated the incident', () => {
    expect(isGapIncidentExpired({ createdAt: 1_000 }, 2_000)).toBe(true);
    expect(isGapIncidentExpired({ createdAt: 3_000 }, 2_000)).toBe(false);
    const recentRetry = { id: 'old', createdAt: 1_000, updatedAt: 9_000 };
    expect([...expiredGapIncidentIds([recentRetry], 2_000)]).toEqual(['old']);
  });

  it('continues periodic purge after an IndexedDB failure', async () => {
    vi.useFakeTimers();
    const deleteExpired = vi.fn()
      .mockRejectedValueOnce(new Error('IndexedDB unavailable'))
      .mockResolvedValue(undefined);
    const store = { deleteExpired } as unknown as GapRecordingStore;
    const stop = startGapRetentionPurge(store, () => 300_000_000, 100);

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(100);

    expect(deleteExpired).toHaveBeenCalledTimes(2);
    stop();
  });
});
