import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';
import { rollingCutoff } from '@/lib/gap-recording/policy';
import {
  MATCH_GAP_NOTICE_VERSION,
  type GapClipRecord,
  type GapIncidentRecord,
  type RecordedClip,
} from '@/lib/gap-recording/types';
import { UNAUTHORIZED_UPLOAD_DESTINATION } from '@/lib/gap-recording/upload-transport';

const CONSENTABLE_STATUSES = new Set(['awaiting-consent', 'queued']);

function consentMissing(incident: GapIncidentRecord): boolean {
  return incident.uploadConsentVersion !== MATCH_GAP_NOTICE_VERSION ||
    typeof incident.uploadConsentedAt !== 'number';
}

export async function grantPendingGapConsent(
  store: GapRecordingStore,
  matchUserKey: string,
  incidentId: string,
  consentedAt: number,
): Promise<void> {
  const incident = await store.getIncident(incidentId);
  if (
    !incident ||
    incident.matchUserKey !== matchUserKey ||
    !consentMissing(incident) ||
    !CONSENTABLE_STATUSES.has(incident.status)
  ) return;
  await store.putIncident({
    ...incident,
    status: 'queued',
    uploadConsentedAt: consentedAt,
    uploadConsentVersion: MATCH_GAP_NOTICE_VERSION,
    retryCount: 0,
    nextRetryAt: null,
    lastError: null,
    failureKind: null,
    updatedAt: consentedAt,
  });
}

export async function retryFailedGapUploads(
  store: GapRecordingStore,
  matchUserKey: string,
  retriedAt: number,
): Promise<void> {
  const incidents = await store.listIncidents(matchUserKey);
  for (const incident of incidents) {
    const retryableFailure = incident.status === 'failed' &&
      (incident.failureKind === 'retryable' ||
        incident.lastError === UNAUTHORIZED_UPLOAD_DESTINATION);
    if (incident.status !== 'retrying' && !retryableFailure) continue;
    await store.putIncident({
      ...incident,
      status: 'queued',
      retryCount: 0,
      nextRetryAt: null,
      lastError: null,
      failureKind: null,
      updatedAt: retriedAt,
    });
  }
}

export async function declinePendingGapUploads(
  store: GapRecordingStore,
  matchUserKey: string,
  incidentId: string,
): Promise<void> {
  const incident = await store.getIncident(incidentId);
  if (
    incident &&
    incident.matchUserKey === matchUserKey &&
    consentMissing(incident) &&
    CONSENTABLE_STATUSES.has(incident.status)
  ) {
    await store.deleteIncidentData(incident.id);
  }
}

export async function persistGapClip(params: {
  store: GapRecordingStore;
  matchId: string;
  userId: string;
  matchUserKey: string;
  incident: GapIncidentRecord | null;
  clip: RecordedClip;
  now: number;
}): Promise<boolean> {
  const { store, matchId, userId, matchUserKey, incident, clip, now } = params;
  const belongsToIncident = incident !== null &&
    clip.endedAt >= incident.captureStartedAt &&
    (incident.captureEndedAt === null || clip.startedAt <= incident.captureEndedAt);
  const record: GapClipRecord = {
    ...clip,
    matchId,
    userId,
    matchUserKey,
    byteLength: clip.blob.size,
    incidentId: belongsToIncident ? incident.id : null,
  };
  await store.putClip(record);
  await store.pruneRolling(matchUserKey, rollingCutoff(now));
  return belongsToIncident;
}
