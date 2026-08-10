import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GapRecordingStore } from '@/lib/gap-recording/indexed-db';
import type { GapClipRecord, GapIncidentRecord } from '@/lib/gap-recording/types';
import { uploadPendingGapRecordings } from '@/lib/gap-recording/uploader';

vi.mock('@/lib/public-config', () => ({
  publicConfig: {
    storage: { matchGapUploadOrigin: 'http://localhost:8000' },
  },
}));

const MATCH_ID = '6f069abc-a25d-4e99-b63c-473b507021af';
const USER_ID = '32e82aef-1f0e-40db-9136-2e63e7b77346';
const INCIDENT_ID = '00add584-fe7d-4766-9a97-b2e3f5b6152a';

function incident(): GapIncidentRecord {
  return {
    id: INCIDENT_ID,
    matchId: MATCH_ID,
    webcamSessionId: '0ffb5e08-0385-4312-ab9f-f8e7bc799d2e',
    userId: USER_ID,
    matchUserKey: `${MATCH_ID}:${USER_ID}`,
    detectedAt: 20_000,
    captureStartedAt: 10_000,
    captureEndedAt: 30_000,
    status: 'queued',
    clipIds: ['9ae60030-3c6b-46a7-8e30-45eab3e959e6'],
    byteLength: 3,
    captureCapped: false,
    interrupted: false,
    remoteIncidentId: null,
    retryCount: 0,
    nextRetryAt: null,
    lastError: null,
    createdAt: 30_000,
    updatedAt: 30_000,
  };
}

function clip(): GapClipRecord {
  return {
    id: '9ae60030-3c6b-46a7-8e30-45eab3e959e6',
    matchId: MATCH_ID,
    userId: USER_ID,
    matchUserKey: `${MATCH_ID}:${USER_ID}`,
    recordingSessionId: 'session',
    sequence: 0,
    startedAt: 10_000,
    endedAt: 15_000,
    mimeType: 'video/webm',
    byteLength: 3,
    incidentId: INCIDENT_ID,
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'video/webm' }),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('gap recording uploader retention', () => {
  it('deletes expired local evidence instead of retrying forever', async () => {
    let deleted = false;
    const store = {
      listIncidents: async () => [incident()],
      listIncidentClips: async () => [clip()],
      deleteIncidentData: async () => { deleted = true; },
      putIncident: async () => {},
    } as unknown as GapRecordingStore;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ detail: { code: 'GAP_RECORDING_EXPIRED' } }),
      { status: 410, headers: { 'Content-Type': 'application/json' } },
    )));

    const result = await uploadPendingGapRecordings(store, MATCH_ID, USER_ID, 40_000);

    expect(deleted).toBe(true);
    expect(result).toEqual({ uploaded: 0, nextRetryAt: null });
  });

  it('usa il trasporto raw soltanto verso lo storage loopback autorizzato', async () => {
    let deleted = false;
    const updates: GapIncidentRecord[] = [];
    const store = {
      listIncidents: async () => [incident()],
      listIncidentClips: async () => [clip()],
      deleteIncidentData: async () => { deleted = true; },
      putIncident: async (value: GapIncidentRecord) => { updates.push(value); },
    } as unknown as GapRecordingStore;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/gap-recordings')) {
        return Response.json({ data: {
          incident_id: INCIDENT_ID,
          status: 'awaiting_upload',
          expires_at: '2026-08-13T12:00:00Z',
          uploads: [{
            client_clip_id: clip().id,
            url: 'http://localhost:8000/api/tournaments/dev/match-gap-storage/upload',
            fields: {
              'Content-Type': 'video/webm',
              'X-Ebartex-Gap-Checksum': 'signed-checksum',
              'X-Ebartex-Gap-Ticket': 'signed-ticket',
            },
            transport: 'raw',
          }],
        } });
      }
      if (url.includes('/dev/match-gap-storage/upload')) {
        expect(init?.credentials).toBe('omit');
        expect(init?.body).toBeInstanceOf(Blob);
        const headers = new Headers(init?.headers);
        expect(headers.get('X-Ebartex-Gap-Ticket')).toBe('signed-ticket');
        expect(headers.get('Content-Type')).toBe('video/webm');
        return new Response(null, { status: 204 });
      }
      if (url.endsWith('/complete')) {
        return Response.json({ data: {
          incident_id: INCIDENT_ID,
          status: 'ready',
          expires_at: '2026-08-13T12:00:00Z',
        } });
      }
      return new Response(null, { status: 500 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadPendingGapRecordings(
      store, MATCH_ID, USER_ID, 40_000,
    )).resolves.toEqual({ uploaded: 1, nextRetryAt: null });
    expect(updates.at(-1)?.status).toBe('uploading');
    expect(deleted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
