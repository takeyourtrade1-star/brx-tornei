import { describe, expect, it } from 'vitest';
import { withGapNetworkState } from '@/lib/gap-recording/network-state';
import type { GapProtectionSnapshot } from '@/lib/gap-recording/types';

function snapshot(overrides: Partial<GapProtectionSnapshot> = {}): GapProtectionSnapshot {
  return {
    status: 'queued',
    pendingIncidents: 1,
    consentRequiredIncidents: 0,
    retryingIncidents: 0,
    failedIncidents: 0,
    retryableFailedIncidents: 0,
    waitingForNetwork: false,
    retainedBytes: 100,
    error: null,
    uploadError: null,
    upload: null,
    ...overrides,
  };
}

describe('gap recording network state', () => {
  it('marks consented pending evidence as waiting while offline', () => {
    expect(withGapNetworkState(snapshot(), false).waitingForNetwork).toBe(true);
  });

  it('does not call unconsented or online evidence an upload in progress', () => {
    expect(withGapNetworkState(snapshot({ consentRequiredIncidents: 1 }), false)
      .waitingForNetwork).toBe(false);
    expect(withGapNetworkState(snapshot(), true).waitingForNetwork).toBe(false);
  });
});
