import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';
import type {
  GapClipRecord,
  GapIncidentRecord,
  GapProtectionSnapshot,
} from '@/lib/gap-recording/types';

interface NewIncidentInput {
  id: string;
  matchId: string;
  webcamSessionId: string;
  userId: string;
  matchUserKey: string;
  detectedAt: number;
  captureStartedAt: number;
}

export function newGapIncident(input: NewIncidentInput): GapIncidentRecord {
  return {
    ...input,
    captureEndedAt: null,
    status: 'capturing',
    clipIds: [],
    byteLength: 0,
    captureCapped: false,
    interrupted: false,
    uploadConsentedAt: null,
    uploadConsentVersion: null,
    remoteIncidentId: null,
    retryCount: 0,
    nextRetryAt: null,
    lastError: null,
    failureKind: null,
    createdAt: input.detectedAt,
    updatedAt: input.detectedAt,
  };
}

export function withClipSummary(
  incident: GapIncidentRecord,
  clips: GapClipRecord[],
  updatedAt: number,
): GapIncidentRecord {
  return {
    ...incident,
    clipIds: clips.map((clip) => clip.id),
    byteLength: clips.reduce((total, clip) => total + clip.byteLength, 0),
    updatedAt,
  };
}

export async function recoverInterruptedIncidents(
  store: GapRecordingStore,
  matchUserKey: string,
  now: number,
): Promise<void> {
  const incidents = await store.listIncidents(matchUserKey);
  for (const incident of incidents) {
    if (incident.status !== 'capturing' && incident.status !== 'closing') continue;
    const clips = await store.listIncidentClips(incident.id);
    const lastEndedAt = clips.length > 0
      ? Math.max(...clips.map((clip) => clip.endedAt))
      : incident.detectedAt;
    const recovered = withClipSummary(incident, clips, now);
    await store.putIncident({
      ...recovered,
      captureEndedAt: lastEndedAt,
      status: clips.length > 0 ? 'awaiting-consent' : 'failed',
      interrupted: true,
      lastError: clips.length > 0 ? null : 'Registrazione interrotta senza clip salvate.',
    });
  }
}

export async function finalizeGapIncident(
  store: GapRecordingStore,
  incident: GapIncidentRecord,
  now: number,
): Promise<GapIncidentRecord> {
  const clips = await store.assignWindow(
    incident.matchUserKey,
    incident.id,
    incident.captureStartedAt,
    incident.captureEndedAt,
  );
  const summarized = withClipSummary(incident, clips, now);
  const finalized: GapIncidentRecord = {
    ...summarized,
    status: clips.length > 0 ? 'awaiting-consent' : 'failed',
    lastError: clips.length > 0 ? null : 'Nessuna clip disponibile per la disconnessione.',
  };
  await store.putIncident(finalized);
  return finalized;
}

export async function buildGapSnapshot(
  store: GapRecordingStore,
  matchUserKey: string,
  active: GapIncidentRecord | null,
  error: string | null,
): Promise<GapProtectionSnapshot> {
  const incidents = await store.listIncidents(matchUserKey);
  const pending = incidents.filter((incident) =>
    [
      'awaiting-consent',
      'queued',
      'preparing',
      'uploading',
      'finalizing',
      'retrying',
    ].includes(incident.status) ||
      (incident.status === 'failed' && incident.nextRetryAt !== null),
  );
  const consentRequired = incidents.filter(
    (incident) =>
      incident.status === 'awaiting-consent' &&
      (incident.uploadConsentVersion !== 'peer-gap-review-v1' ||
        typeof incident.uploadConsentedAt !== 'number'),
  );
  const retrying = incidents.filter(
    (incident) => incident.status === 'retrying' ||
      (incident.status === 'failed' && incident.nextRetryAt !== null),
  );
  const failed = incidents.filter(
    (incident) => incident.status === 'failed' && incident.nextRetryAt === null,
  );
  const retryableFailed = failed.filter((incident) => incident.failureKind === 'retryable');
  const uploadFailure = [...retrying, ...failed]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .find((incident) => incident.lastError)?.lastError ?? null;
  const status = error
    ? 'error'
    : active?.status === 'closing'
      ? 'closing'
      : active
        ? 'capturing'
        : pending.length > 0
          ? 'queued'
          : 'armed';
  return {
    status,
    pendingIncidents: pending.length,
    consentRequiredIncidents: consentRequired.length,
    retryingIncidents: retrying.length,
    failedIncidents: failed.length,
    retryableFailedIncidents: retryableFailed.length,
    retainedBytes: incidents.reduce((total, incident) => total + incident.byteLength, 0),
    error,
    uploadError: uploadFailure,
    upload: null,
  };
}
