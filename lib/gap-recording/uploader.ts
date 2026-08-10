import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';
import { makeMatchUserKey } from '@/lib/gap-recording/policy';
import type { GapClipRecord, GapIncidentRecord } from '@/lib/gap-recording/types';
import { MATCH_GAP_NOTICE_VERSION } from '@/lib/gap-recording/types';
import { uploadGapClipsWithLimit } from '@/lib/gap-recording/upload-transport';
import {
  gapUploadCompleteResponseSchema,
  gapUploadInitResponseSchema,
  type CreateGapRecordingInput,
} from '@/lib/validations/gap-recording';

const MAX_RETRY_DELAY_MS = 5 * 60 * 1_000;

class TerminalGapUploadError extends Error {}

export interface GapUploadRunResult {
  uploaded: number;
  nextRetryAt: number | null;
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
    throw new Error('La registrazione locale non è ancora chiusa.');
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

async function initUpload(matchId: string, body: CreateGapRecordingInput) {
  const response = await fetch(
    `/api/tournaments/match/${encodeURIComponent(matchId)}/gap-recordings`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(30_000),
    },
  );
  const json = await response.json().catch(() => ({}));
  if (response.status === 410) {
    throw new TerminalGapUploadError('La finestra di conservazione è scaduta.');
  }
  if (!response.ok) throw new Error('Impossibile preparare il caricamento protetto.');
  const parsed = gapUploadInitResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error('Risposta di upload non valida.');
  return parsed.data.data;
}

async function completeUpload(matchId: string, recordingId: string): Promise<void> {
  const response = await fetch(
    `/api/tournaments/match/${encodeURIComponent(matchId)}/gap-recordings/${encodeURIComponent(recordingId)}/complete`,
    {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(30_000),
    },
  );
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Verifica del caricamento non riuscita.');
  if (!gapUploadCompleteResponseSchema.safeParse(json).success) {
    throw new Error('Conferma del caricamento non valida.');
  }
}

function retryAt(incident: GapIncidentRecord, now: number): number {
  const delay = Math.min(5_000 * 2 ** incident.retryCount, MAX_RETRY_DELAY_MS);
  return now + delay;
}

async function uploadIncident(
  store: GapRecordingStore,
  incident: GapIncidentRecord,
  now: number,
): Promise<boolean> {
  const clips = await store.listIncidentClips(incident.id);
  if (clips.length === 0) throw new Error('Nessuna clip locale disponibile.');
  const body = await manifest(incident, clips);
  const initialized = await initUpload(incident.matchId, body);
  await store.putIncident({
    ...incident,
    status: 'uploading',
    remoteIncidentId: initialized.incident_id,
    lastError: null,
    updatedAt: now,
  });
  if (initialized.status !== 'ready') {
    const tickets = new Map(
      initialized.uploads.map((ticket) => [ticket.client_clip_id, ticket]),
    );
    await uploadGapClipsWithLimit(clips, tickets);
    await completeUpload(incident.matchId, initialized.incident_id);
  }
  await store.deleteIncidentData(incident.id);
  return true;
}

export async function uploadPendingGapRecordings(
  store: GapRecordingStore,
  matchId: string,
  userId: string,
  now = Date.now(),
): Promise<GapUploadRunResult> {
  const incidents = await store.listIncidents(makeMatchUserKey(matchId, userId));
  let uploaded = 0;
  let nextRetryAt: number | null = null;
  for (const incident of incidents) {
    if (!['queued', 'uploading', 'failed'].includes(incident.status)) continue;
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
      if (await uploadIncident(store, incident, now)) uploaded += 1;
    } catch (error) {
      if (error instanceof TerminalGapUploadError) {
        await store.deleteIncidentData(incident.id);
        continue;
      }
      const scheduled = retryAt(incident, now);
      await store.putIncident({
        ...incident,
        status: 'failed',
        retryCount: incident.retryCount + 1,
        nextRetryAt: scheduled,
        lastError: error instanceof Error ? error.message : 'Upload non riuscito.',
        updatedAt: now,
      });
      nextRetryAt = nextRetryAt === null ? scheduled : Math.min(nextRetryAt, scheduled);
    }
  }
  return { uploaded, nextRetryAt };
}
