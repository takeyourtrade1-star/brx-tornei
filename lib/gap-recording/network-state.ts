import type { GapProtectionSnapshot } from '@/lib/gap-recording/types';

export function withGapNetworkState(
  snapshot: GapProtectionSnapshot,
  online: boolean,
): GapProtectionSnapshot {
  const consentedPending = snapshot.pendingIncidents > snapshot.consentRequiredIncidents;
  const waitingForNetwork = !online && consentedPending;
  return snapshot.waitingForNetwork === waitingForNetwork
    ? snapshot
    : { ...snapshot, waitingForNetwork };
}
