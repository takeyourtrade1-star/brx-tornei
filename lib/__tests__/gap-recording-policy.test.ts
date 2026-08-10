import { describe, expect, it } from 'vitest';
import {
  captureCapAt,
  chooseGapRecordingMimeType,
  clipOverlapsWindow,
  GAP_MAX_CAPTURE_MS,
  GAP_LOCAL_TTL_MS,
  isGapConnectedState,
  isDesktopGapRecordingClient,
  isGapLossState,
  makeMatchUserKey,
} from '@/lib/gap-recording/policy';

describe('gap recording policy', () => {
  it('prefers a desktop WebM profile and falls back deterministically', () => {
    const supported = new Set(['video/webm', 'video/mp4']);
    expect(chooseGapRecordingMimeType((value) => supported.has(value))).toBe(
      'video/webm',
    );
    expect(chooseGapRecordingMimeType(() => false)).toBeUndefined();
  });

  it('opens gaps only for a recovered-link loss state', () => {
    expect(isGapConnectedState('connected')).toBe(true);
    expect(isGapConnectedState('waiting')).toBe(false);
    expect(isGapLossState('reconnecting')).toBe(true);
    expect(isGapLossState('failed')).toBe(true);
    expect(isGapLossState('connecting')).toBe(false);
    expect(isGapLossState('peer-left')).toBe(false);
  });

  it('selects every clip touching pre-roll, gap or post-roll', () => {
    expect(clipOverlapsWindow({ startedAt: 80, endedAt: 100 }, 100, 200)).toBe(true);
    expect(clipOverlapsWindow({ startedAt: 200, endedAt: 220 }, 100, 200)).toBe(true);
    expect(clipOverlapsWindow({ startedAt: 79, endedAt: 99 }, 100, 200)).toBe(false);
    expect(clipOverlapsWindow({ startedAt: 201, endedAt: 220 }, 100, 200)).toBe(false);
    expect(clipOverlapsWindow({ startedAt: 500, endedAt: 520 }, 100, null)).toBe(true);
  });

  it('uses a collision-free match/user partition and a bounded capture', () => {
    expect(makeMatchUserKey('match', 'user')).toBe('match:user');
    expect(captureCapAt(123)).toBe(123 + GAP_MAX_CAPTURE_MS);
    expect(GAP_LOCAL_TTL_MS).toBe(72 * 60 * 60 * 1_000);
  });

  it('arms only desktop clients, including an iPadOS desktop-UA guard', () => {
    expect(isDesktopGapRecordingClient({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      maxTouchPoints: 0,
      userAgentData: { mobile: false },
    })).toBe(true);
    expect(isDesktopGapRecordingClient({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      maxTouchPoints: 5,
      userAgentData: { mobile: true },
    })).toBe(false);
    expect(isDesktopGapRecordingClient({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
      maxTouchPoints: 5,
    })).toBe(false);
  });
});
