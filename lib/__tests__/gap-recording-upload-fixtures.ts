import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';
import type { GapClipRecord, GapIncidentRecord } from '@/lib/gap-recording/types';

export const GAP_MATCH_ID = '6f069abc-a25d-4e99-b63c-473b507021af';
export const GAP_USER_ID = '32e82aef-1f0e-40db-9136-2e63e7b77346';
export const GAP_INCIDENT_ID = '00add584-fe7d-4766-9a97-b2e3f5b6152a';
export const GAP_CLIP_ID = '9ae60030-3c6b-46a7-8e30-45eab3e959e6';

export function gapIncident(overrides: Partial<GapIncidentRecord> = {}): GapIncidentRecord {
  return {
    id: GAP_INCIDENT_ID,
    matchId: GAP_MATCH_ID,
    webcamSessionId: '0ffb5e08-0385-4312-ab9f-f8e7bc799d2e',
    userId: GAP_USER_ID,
    matchUserKey: `${GAP_MATCH_ID}:${GAP_USER_ID}`,
    detectedAt: 20_000,
    captureStartedAt: 10_000,
    captureEndedAt: 30_000,
    status: 'queued',
    clipIds: [GAP_CLIP_ID],
    byteLength: 3,
    captureCapped: false,
    interrupted: false,
    uploadConsentedAt: 35_000,
    uploadConsentVersion: 'peer-gap-review-v1',
    remoteIncidentId: null,
    retryCount: 0,
    nextRetryAt: null,
    lastError: null,
    createdAt: 30_000,
    updatedAt: 30_000,
    ...overrides,
  };
}

export function gapClip(overrides: Partial<GapClipRecord> = {}): GapClipRecord {
  return {
    id: GAP_CLIP_ID,
    matchId: GAP_MATCH_ID,
    userId: GAP_USER_ID,
    matchUserKey: `${GAP_MATCH_ID}:${GAP_USER_ID}`,
    recordingSessionId: 'session',
    sequence: 0,
    startedAt: 10_000,
    endedAt: 15_000,
    mimeType: 'video/webm',
    byteLength: 3,
    incidentId: GAP_INCIDENT_ID,
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'video/webm' }),
    ...overrides,
  };
}

export class UploadMemoryStore {
  current = gapIncident();
  readonly clips: GapClipRecord[] = [gapClip()];
  deleted = false;

  async listIncidents() { return [this.current]; }
  async listIncidentClips() { return this.clips; }
  async getIncident() { return this.current; }
  async putIncident(value: GapIncidentRecord) { this.current = value; }
  async deleteIncidentData() { this.deleted = true; }

  asStore(): GapRecordingStore {
    return this as unknown as GapRecordingStore;
  }
}

export function rawUploadInitResponse() {
  return { data: {
    incident_id: GAP_INCIDENT_ID,
    status: 'awaiting_upload',
    expires_at: '2026-08-13T12:00:00Z',
    uploads: [{
      client_clip_id: GAP_CLIP_ID,
      url: 'http://localhost:8000/api/tournaments/dev/match-gap-storage/upload',
      fields: {
        'Content-Type': 'video/webm',
        'X-Ebartex-Gap-Checksum': 'signed-checksum',
        'X-Ebartex-Gap-Ticket': 'signed-ticket',
      },
      transport: 'raw',
    }],
  } };
}
