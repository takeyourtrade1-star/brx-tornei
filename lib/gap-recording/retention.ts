import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';
import { GAP_LOCAL_TTL_MS } from '@/lib/gap-recording/policy';
import type { GapIncidentRecord } from '@/lib/gap-recording/types';

export const GAP_RETENTION_PURGE_INTERVAL_MS = 60_000;

export function isGapIncidentExpired(
  incident: Pick<GapIncidentRecord, 'createdAt'>,
  before: number,
): boolean {
  return incident.createdAt < before;
}

export function expiredGapIncidentIds(
  incidents: Array<Pick<GapIncidentRecord, 'id' | 'createdAt'>>,
  before: number,
): Set<string> {
  return new Set(
    incidents.filter((incident) => isGapIncidentExpired(incident, before))
      .map((incident) => incident.id),
  );
}

export function startGapRetentionPurge(
  store: GapRecordingStore,
  now: () => number = Date.now,
  intervalMs = GAP_RETENTION_PURGE_INTERVAL_MS,
): () => void {
  let running = false;
  const purge = () => {
    if (running) return;
    running = true;
    void store.deleteExpired(now() - GAP_LOCAL_TTL_MS)
      .catch(() => {})
      .finally(() => { running = false; });
  };
  const timer = setInterval(purge, intervalMs);
  return () => clearInterval(timer);
}
