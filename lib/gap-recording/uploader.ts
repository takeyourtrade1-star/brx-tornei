import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';
import { makeMatchUserKey } from '@/lib/gap-recording/policy';
import type {
  GapClipRecord,
  GapIncidentRecord,
  GapUploadProgress,
} from '@/lib/gap-recording/types';
import { MATCH_GAP_NOTICE_VERSION } from '@/lib/gap-recording/types';
import {
  GapClipUploadError,
  uploadGapClipsWithLimit,
} from '@/lib/gap-recording/upload-transport';
import {
  completeGapUpload,
  initGapUpload,
  TerminalGapUploadError,
} from '@/lib/gap-recording/upload-api';
import type { CreateGapRecordingInput } from '@/lib/validations/gap-recording';

const MAX_RETRY_DELAY_MS = 5 * 60 * 1_000;
const MAX_RETRY_ATTEMPTS = 5;

export interface GapUploadRunResult {
  uploaded: number;
  nextRetryAt: number | null;
}

export interface GapUploaderOptions {
  onProgress?: (progress: GapUploadProgress) => void;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function checksum(clip: GapClipRecord): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await clip.blob.arrayBuffer());
  return bytesToBase64(new Uint8Array(digest));
}

async function manifest(
  incident: GapIncidentRecord,
  clips: GapClipRecord[],
): Promise<CreateGapRecordingInput> {
  if (incident.captureEndedAt === null) {
    throw new TerminalGapUploadError('La registrazione locale non è ancora chiusa.');
  }
  if (
    incident.uploadConsentVersion !== MATCH_GAP_NOTICE_VERSION ||
    typeof incident.uploadConsentedAt !== 'number'
  ) {
    throw new TerminalGapUploadError('Consenso al caricamento mancante.');
  }
  const ordered = [...clips].sort((left, right) => left.sequence - right.sequence);
  const items = await Promise.all(
    ordered.map(async (clip, sequence) => ({
      client_clip_id: clip.id,
      sequence,
      started_at: new Date(clip.startedAt).toISOString(),
      ended_at: new Date(clip.endedAt).toISOString(),
      content_type: clip.mimeType.toLowerCase() as CreateGapRecordingInput['clips'][number]['content_type'],
      byte_length: clip.byteLength,
      sha256: await checksum(clip),
    })),
  );
  return {
    client_incident_id: incident.id,
    webcam_session_id: incident.webcamSessionId,
    detected_at: new Date(incident.detectedAt).toISOString(),
    capture_started_at: new Date(incident.captureStartedAt).toISOString(),
    capture_ended_at: new Date(incident.captureEndedAt).toISOString(),
    capture_capped: incident.captureCapped,
    interrupted: incident.interrupted,
    upload_consented_at: new Date(incident.uploadConsentedAt).toISOString(),
    upload_consent_version: MATCH_GAP_NOTICE_VERSION,
    temporary_storage_acknowledged: true,
    opponent_review_acknowledged: true,
    clips: items,
  };
}

function retryAt(incident: GapIncidentRecord, now: number): number {
  const delay = Math.min(5_000 * 2 ** incident.retryCount, MAX_RETRY_DELAY_MS);
  return now + delay;
}

async function uploadIncident(
  store: GapRecordingStore,
  incident: GapIncidentRecord,
  now: number,
  onProgress?: (progress: GapUploadProgress) => void,
): Promise<boolean> {
  const clips = await store.listIncidentClips(incident.id);
  if (clips.length === 0) {
    throw new TerminalGapUploadError('Nessuna clip locale disponibile.');
  }
  const totalBytes = clips.reduce((sum, clip) => sum + clip.byteLength, 0);
  const emit = (progress: Partial<GapUploadProgress> & Pick<GapUploadProgress, 'phase'>) =>
    onProgress?.({
      phase: progress.phase,
      incidentId: incident.id,
      uploadedBytes: progress.uploadedBytes ?? 0,
      totalBytes: progress.totalBytes ?? totalBytes,
      completedClips: progress.completedClips ?? 0,
      totalClips: progress.totalClips ?? clips.length,
      error: progress.error ?? null,
      retryAt: progress.retryAt ?? null,
      retryable: progress.retryable ?? false,
    });
  await store.putIncident({
    ...incident,
    status: 'preparing',
    nextRetryAt: null,
    lastError: null,
    failureKind: null,
    updatedAt: now,
  });
  emit({ phase: 'preparing' });
  const body = await manifest(incident, clips);
  const initialized = await initGapUpload(incident.matchId, body);
  await store.putIncident({
    ...incident,
    status: 'uploading',
    remoteIncidentId: initialized.incident_id,
    nextRetryAt: null,
    lastError: null,
    failureKind: null,
    updatedAt: now,
  });
  if (initialized.status !== 'ready') {
    const tickets = new Map(
      initialized.uploads.map((ticket) => [ticket.client_clip_id, ticket]),
    );
    await uploadGapClipsWithLimit(clips, tickets, (progress) => emit({
      phase: 'uploading',
      ...progress,
    }));
    await store.putIncident({
      ...incident,
      status: 'finalizing',
      remoteIncidentId: initialized.incident_id,
      nextRetryAt: null,
      lastError: null,
      failureKind: null,
      updatedAt: Date.now(),
    });
    emit({
      phase: 'finalizing',
      uploadedBytes: totalBytes,
      completedClips: clips.length,
    });
    await completeGapUpload(incident.matchId, initialized.incident_id);
  }
  await store.deleteIncidentData(incident.id);
  emit({
    phase: 'sent',
    uploadedBytes: totalBytes,
    completedClips: clips.length,
  });
  return true;
}

function isRetryableUploadError(error: unknown): boolean {
  if (error instanceof TerminalGapUploadError) return false;
  if (error instanceof GapClipUploadError) {
    if (error.status === null) return error.retryable;
    return error.status === 408 || error.status === 429 || error.status >= 500;
  }
  return true;
}

export async function uploadPendingGapRecordings(
  store: GapRecordingStore,
  matchId: string,
  userId: string,
  now = Date.now(),
  options: GapUploaderOptions = {},
): Promise<GapUploadRunResult> {
  const incidents = await store.listIncidents(makeMatchUserKey(matchId, userId));
  let uploaded = 0;
  let nextRetryAt: number | null = null;
  for (const incident of incidents) {
    const resumable = ['queued', 'preparing', 'uploading', 'finalizing', 'retrying']
      .includes(incident.status) ||
      (incident.status === 'failed' && incident.nextRetryAt !== null);
    if (!resumable) continue;
    if (
      incident.uploadConsentVersion !== MATCH_GAP_NOTICE_VERSION ||
      typeof incident.uploadConsentedAt !== 'number'
    ) continue;
    if (incident.nextRetryAt && incident.nextRetryAt > now) {
      nextRetryAt = nextRetryAt === null
        ? incident.nextRetryAt
        : Math.min(nextRetryAt, incident.nextRetryAt);
      continue;
    }
    try {
      if (await uploadIncident(store, incident, now, options.onProgress)) uploaded += 1;
    } catch (error) {
      const current = await store.getIncident(incident.id) ?? incident;
      const message = error instanceof Error ? error.message : 'Upload non riuscito.';
      if (error instanceof TerminalGapUploadError && error.discardLocal) {
        await store.deleteIncidentData(incident.id);
        options.onProgress?.({
          phase: 'failed', incidentId: incident.id, uploadedBytes: 0,
          totalBytes: incident.byteLength, completedClips: 0,
          totalClips: incident.clipIds.length, error: message,
          retryAt: null, retryable: false,
        });
        continue;
      }
      const retryable = isRetryableUploadError(error);
      const retryCount = current.retryCount + 1;
      const exhausted = retryable && retryCount >= MAX_RETRY_ATTEMPTS;
      const scheduled = retryable && !exhausted ? retryAt(current, now) : null;
      await store.putIncident({
        ...current,
        status: scheduled === null ? 'failed' : 'retrying',
        retryCount,
        nextRetryAt: scheduled,
        lastError: message,
        failureKind: retryable ? 'retryable' : 'terminal',
        updatedAt: now,
      });
      options.onProgress?.({
        phase: scheduled === null ? 'failed' : 'retrying',
        incidentId: incident.id,
        uploadedBytes: 0,
        totalBytes: incident.byteLength,
        completedClips: 0,
        totalClips: incident.clipIds.length,
        error: message,
        retryAt: scheduled,
        retryable,
      });
      if (scheduled !== null) {
        nextRetryAt = nextRetryAt === null ? scheduled : Math.min(nextRetryAt, scheduled);
      }
    }
  }
  return { uploaded, nextRetryAt };
}
