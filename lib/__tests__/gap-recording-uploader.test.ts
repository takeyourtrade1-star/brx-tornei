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

class SuccessfulUploadRequest {
  static requests: SuccessfulUploadRequest[] = [];
  readonly upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
    onprogress: null,
  };
  readonly headers = new Map<string, string>();
  status = 204;
  responseURL = '';
  timeout = 0;
  withCredentials = false;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  body: XMLHttpRequestBodyInit | null = null;

  constructor() { SuccessfulUploadRequest.requests.push(this); }
  open(_method: string, url: string) { this.responseURL = url; }
  setRequestHeader(key: string, value: string) { this.headers.set(key, value); }
  send(body: XMLHttpRequestBodyInit) {
    this.body = body;
    const total = body instanceof Blob ? body.size : 3;
    this.upload.onprogress?.({ loaded: 1, total, lengthComputable: true } as ProgressEvent);
    this.upload.onprogress?.({ loaded: total, total, lengthComputable: true } as ProgressEvent);
    queueMicrotask(() => this.onload?.());
  }
}

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
    uploadConsentedAt: 35_000,
    uploadConsentVersion: 'peer-gap-review-v1',
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

afterEach(() => {
  SuccessfulUploadRequest.requests = [];
  vi.unstubAllGlobals();
});

describe('gap recording uploader retention', () => {
  it('deletes expired local evidence instead of retrying forever', async () => {
    let deleted = false;
    const store = {
      listIncidents: async () => [incident()],
      listIncidentClips: async () => [clip()],
      getIncident: async () => incident(),
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
    const progress: { phase: string; uploadedBytes: number }[] = [];
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
    vi.stubGlobal('XMLHttpRequest', SuccessfulUploadRequest);

    await expect(uploadPendingGapRecordings(
      store, MATCH_ID, USER_ID, 40_000, {
        onProgress: (value) => progress.push(value),
      },
    )).resolves.toEqual({ uploaded: 1, nextRetryAt: null });
    expect(updates.map((value) => value.status)).toEqual([
      'preparing', 'uploading', 'finalizing',
    ]);
    expect(deleted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [request] = SuccessfulUploadRequest.requests;
    expect(request.withCredentials).toBe(false);
    expect(request.body).toBeInstanceOf(Blob);
    expect(request.headers.get('X-Ebartex-Gap-Ticket')).toBe('signed-ticket');
    expect(request.headers.get('Content-Type')).toBe('video/webm');
    expect(progress).toEqual(expect.arrayContaining([
      expect.objectContaining({ phase: 'uploading', uploadedBytes: 1 }),
      expect.objectContaining({ phase: 'uploading', uploadedBytes: 3 }),
      expect.objectContaining({ phase: 'sent', uploadedBytes: 3 }),
    ]));
  });

  it('ritenta i 5xx con backoff ed espone il fallimento senza fingere un invio', async () => {
    let current = incident();
    const progress: string[] = [];
    const store = {
      listIncidents: async () => [current],
      listIncidentClips: async () => [clip()],
      getIncident: async () => current,
      putIncident: async (value: GapIncidentRecord) => { current = value; },
      deleteIncidentData: async () => {},
    } as unknown as GapRecordingStore;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })));

    await expect(uploadPendingGapRecordings(store, MATCH_ID, USER_ID, 40_000, {
      onProgress: (value) => progress.push(value.phase),
    })).resolves.toEqual({ uploaded: 0, nextRetryAt: 45_000 });

    expect(current).toMatchObject({
      status: 'retrying', retryCount: 1, nextRetryAt: 45_000,
      failureKind: 'retryable',
    });
    expect(progress).toEqual(['preparing', 'retrying']);
  });

  it('tratta il 409 come definitivo e non lo rimette in un loop automatico', async () => {
    let current = incident();
    const fetchMock = vi.fn(async () => new Response(null, { status: 409 }));
    const store = {
      listIncidents: async () => [current],
      listIncidentClips: async () => [clip()],
      getIncident: async () => current,
      putIncident: async (value: GapIncidentRecord) => { current = value; },
      deleteIncidentData: async () => {},
    } as unknown as GapRecordingStore;
    vi.stubGlobal('fetch', fetchMock);

    await uploadPendingGapRecordings(store, MATCH_ID, USER_ID, 40_000);
    expect(current).toMatchObject({
      status: 'failed', nextRetryAt: null, failureKind: 'terminal',
    });
    await uploadPendingGapRecordings(store, MATCH_ID, USER_ID, 50_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
