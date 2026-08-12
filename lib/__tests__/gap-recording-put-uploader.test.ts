import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GAP_CLIP_ID,
  GAP_INCIDENT_ID,
  GAP_MATCH_ID,
  GAP_USER_ID,
  UploadMemoryStore,
} from '@/lib/__tests__/gap-recording-upload-fixtures';
import { uploadPendingGapRecordings } from '@/lib/gap-recording/uploader';

vi.mock('@/lib/public-config', () => ({
  publicConfig: { storage: { matchGapUploadOrigin: 'https://storage.example.test' } },
}));

class ConditionalUploadRequest {
  static requests: ConditionalUploadRequest[] = [];
  readonly upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
  status = 412;
  responseURL = '';
  timeout = 0;
  withCredentials = false;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  method = '';

  constructor() { ConditionalUploadRequest.requests.push(this); }
  open(method: string, url: string) {
    this.method = method;
    this.responseURL = url;
  }
  setRequestHeader() {}
  send() { queueMicrotask(() => this.onload?.()); }
  abort() { this.onabort?.(); }
}

function putUploadInitResponse() {
  return { data: {
    incident_id: GAP_INCIDENT_ID,
    status: 'awaiting_upload',
    expires_at: '2026-08-13T12:00:00Z',
    uploads: [{
      client_clip_id: GAP_CLIP_ID,
      url: 'https://storage.example.test/gap-recordings/clip.webm',
      fields: {
        'Content-Type': 'video/webm',
        'If-None-Match': '*',
        'x-amz-checksum-sha256': 'A'.repeat(43) + '=',
        'x-amz-server-side-encryption': 'AES256',
      },
      transport: 'put',
    }],
  } };
}

function completedResponse() {
  return { data: {
    incident_id: GAP_INCIDENT_ID,
    status: 'ready',
    expires_at: '2026-08-13T12:00:00Z',
  } };
}

afterEach(() => {
  ConditionalUploadRequest.requests = [];
  vi.unstubAllGlobals();
});

describe('conditional gap upload finalization', () => {
  it('keeps local evidence when the server requires a page reload at cutover', async () => {
    const store = new UploadMemoryStore();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 426 })));
    vi.stubGlobal('XMLHttpRequest', ConditionalUploadRequest);

    await uploadPendingGapRecordings(
      store.asStore(), GAP_MATCH_ID, GAP_USER_ID, 40_000,
    );

    expect(store.current).toMatchObject({
      status: 'failed',
      failureKind: 'terminal',
      lastError: expect.stringContaining('ricarica la pagina'),
    });
    expect(store.deleted).toBe(false);
    expect(ConditionalUploadRequest.requests).toHaveLength(0);
  });

  it('continues from PUT 412 to authoritative completion', async () => {
    const store = new UploadMemoryStore();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith('/complete')
        ? Response.json(completedResponse())
        : Response.json(putUploadInitResponse()));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('XMLHttpRequest', ConditionalUploadRequest);

    await expect(uploadPendingGapRecordings(
      store.asStore(), GAP_MATCH_ID, GAP_USER_ID, 40_000,
    )).resolves.toEqual({ uploaded: 1, nextRetryAt: null });

    expect(ConditionalUploadRequest.requests).toHaveLength(1);
    expect(ConditionalUploadRequest.requests[0].method).toBe('PUT');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('/complete');
    expect(store.deleted).toBe(true);
  });

  it('keeps a completion mismatch terminal and retains the local blob', async () => {
    const store = new UploadMemoryStore();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith('/complete')
        ? new Response(null, { status: 422 })
        : Response.json(putUploadInitResponse()));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('XMLHttpRequest', ConditionalUploadRequest);

    await uploadPendingGapRecordings(
      store.asStore(), GAP_MATCH_ID, GAP_USER_ID, 40_000,
    );

    expect(store.current).toMatchObject({
      status: 'failed',
      failureKind: 'terminal',
      nextRetryAt: null,
      lastError: 'Il caricamento non pu\u00f2 essere finalizzato.',
    });
    expect(store.deleted).toBe(false);
    expect(store.clips[0].blob.size).toBe(3);

    await uploadPendingGapRecordings(
      store.asStore(), GAP_MATCH_ID, GAP_USER_ID, 50_000,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(ConditionalUploadRequest.requests).toHaveLength(1);
  });

  it('schedules a bounded retry after an S3 conditional-write conflict', async () => {
    class ConflictingRequest extends ConditionalUploadRequest {
      override status = 409;
    }
    const store = new UploadMemoryStore();
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(putUploadInitResponse())));
    vi.stubGlobal('XMLHttpRequest', ConflictingRequest);

    await expect(uploadPendingGapRecordings(
      store.asStore(), GAP_MATCH_ID, GAP_USER_ID, 40_000,
    )).resolves.toEqual({ uploaded: 0, nextRetryAt: 45_000 });

    expect(store.current).toMatchObject({
      status: 'retrying',
      retryCount: 1,
      nextRetryAt: 45_000,
      failureKind: 'retryable',
    });
    expect(store.deleted).toBe(false);
  });
});
