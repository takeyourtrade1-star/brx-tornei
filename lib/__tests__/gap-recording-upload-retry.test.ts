import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadPendingGapRecordings } from '@/lib/gap-recording/uploader';
import {
  GAP_MATCH_ID,
  GAP_USER_ID,
  rawUploadInitResponse,
  UploadMemoryStore,
} from '@/lib/__tests__/gap-recording-upload-fixtures';

vi.mock('@/lib/public-config', () => ({
  publicConfig: { storage: { matchGapUploadOrigin: 'http://localhost:8000' } },
}));

class StatusUploadRequest {
  static status = 204;
  static count = 0;
  readonly upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
  status = StatusUploadRequest.status;
  responseURL = '';
  timeout = 0;
  withCredentials = false;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  constructor() { StatusUploadRequest.count += 1; }
  open(_method: string, url: string) { this.responseURL = url; }
  setRequestHeader() {}
  send() { queueMicrotask(() => this.onload?.()); }
  abort() { this.onabort?.(); }
}

afterEach(() => {
  StatusUploadRequest.count = 0;
  StatusUploadRequest.status = 204;
  vi.unstubAllGlobals();
});

describe('gap upload retry authentication', () => {
  it('keeps an init BFF 401 retryable without deleting IndexedDB evidence', async () => {
    const store = new UploadMemoryStore();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 401 })));

    await uploadPendingGapRecordings(store.asStore(), GAP_MATCH_ID, GAP_USER_ID, 40_000);

    expect(store.current).toMatchObject({
      status: 'retrying', retryCount: 1, nextRetryAt: 45_000,
      failureKind: 'retryable',
    });
    expect(store.deleted).toBe(false);
  });

  it('keeps a complete BFF 401 retryable after a successful storage upload', async () => {
    const store = new UploadMemoryStore();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith('/complete')
        ? new Response(null, { status: 401 })
        : Response.json(rawUploadInitResponse()));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('XMLHttpRequest', StatusUploadRequest);

    await uploadPendingGapRecordings(store.asStore(), GAP_MATCH_ID, GAP_USER_ID, 40_000);

    expect(store.current).toMatchObject({
      status: 'retrying', retryCount: 1, nextRetryAt: 45_000,
      failureKind: 'retryable',
    });
    expect(store.deleted).toBe(false);
  });

  it('regenerates a 403 storage ticket and stops after five attempts', async () => {
    const store = new UploadMemoryStore();
    const fetchMock = vi.fn(async () => Response.json(rawUploadInitResponse()));
    StatusUploadRequest.status = 403;
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('XMLHttpRequest', StatusUploadRequest);

    for (const now of [0, 5_000, 15_000, 35_000, 75_000]) {
      await uploadPendingGapRecordings(store.asStore(), GAP_MATCH_ID, GAP_USER_ID, now);
    }
    await uploadPendingGapRecordings(store.asStore(), GAP_MATCH_ID, GAP_USER_ID, 200_000);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(StatusUploadRequest.count).toBe(5);
    expect(store.current).toMatchObject({
      status: 'failed', retryCount: 5, nextRetryAt: null,
      failureKind: 'retryable',
    });
    expect(store.deleted).toBe(false);
  });

  it('does not recreate or overwrite an incident after losing the upload lease', async () => {
    const controller = new AbortController();
    const getIncident = vi.fn(async () => undefined);
    const putIncident = vi.fn(async () => {
      controller.abort();
      throw new Error('Concurrent owner completed and deleted the incident');
    });
    const deleteIncidentData = vi.fn(async () => {});
    const store = {
      listIncidents: async () => [new UploadMemoryStore().current],
      listIncidentClips: async () => new UploadMemoryStore().clips,
      getIncident,
      putIncident,
      deleteIncidentData,
    } as unknown as ReturnType<UploadMemoryStore['asStore']>;

    await expect(uploadPendingGapRecordings(
      store, GAP_MATCH_ID, GAP_USER_ID, 40_000, { signal: controller.signal },
    )).resolves.toEqual({ uploaded: 0, nextRetryAt: null });

    expect(controller.signal.aborted).toBe(true);
    expect(getIncident).not.toHaveBeenCalled();
    expect(putIncident).toHaveBeenCalledTimes(1);
    expect(deleteIncidentData).not.toHaveBeenCalled();
  });
});
