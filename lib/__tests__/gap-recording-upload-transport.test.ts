import { afterEach, describe, expect, it, vi } from 'vitest';
import { gapClip } from '@/lib/__tests__/gap-recording-upload-fixtures';
import {
  uploadGapClipsWithLimit,
  type GapUploadTicket,
} from '@/lib/gap-recording/upload-transport';
import { isRetryableGapUploadError } from '@/lib/gap-recording/upload-retry';

vi.mock('@/lib/public-config', () => ({
  publicConfig: { storage: { matchGapUploadOrigin: 'https://storage.example.test' } },
}));

class ControlledRequest {
  static requests: ControlledRequest[] = [];
  readonly upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
  status = 204;
  responseURL = '';
  timeout = 0;
  withCredentials = false;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  aborted = false;
  method = '';
  body: XMLHttpRequestBodyInit | null = null;
  headers = new Map<string, string>();
  constructor() { ControlledRequest.requests.push(this); }
  open(method: string, url: string) {
    this.method = method;
    this.responseURL = url;
  }
  setRequestHeader(key: string, value: string) { this.headers.set(key, value); }
  send(body?: XMLHttpRequestBodyInit | null) {
    this.body = body ?? null;
    if (this.responseURL.endsWith('/fail')) {
      this.status = 500;
      queueMicrotask(() => this.onload?.());
    }
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}

function ticket(path: string): GapUploadTicket {
  return {
    url: `https://storage.example.test/${path}`,
    fields: {},
    transport: 'multipart',
  };
}

function putTicket(path: string): GapUploadTicket {
  return {
    url: `https://storage.example.test/${path}`,
    fields: {
      'Content-Type': 'video/webm',
      'If-None-Match': '*',
      'x-amz-checksum-sha256': 'A'.repeat(43) + '=',
      'x-amz-server-side-encryption': 'AES256',
    },
    transport: 'put',
  };
}

afterEach(() => {
  ControlledRequest.requests = [];
  vi.unstubAllGlobals();
});

describe('gap clip upload transport cancellation', () => {
  it('fails before starting any XHR when a capability is missing', async () => {
    vi.stubGlobal('XMLHttpRequest', ControlledRequest);
    const clips = [gapClip(), gapClip({ id: 'clip-2', sequence: 1 })];

    await expect(uploadGapClipsWithLimit(
      clips, new Map([[clips[0].id, ticket('first')]]),
    )).rejects.toThrow('Capability di upload mancante');
    expect(ControlledRequest.requests).toHaveLength(0);
  });

  it('aborts and drains a sibling XHR before exposing the first failure', async () => {
    vi.stubGlobal('XMLHttpRequest', ControlledRequest);
    const clips = [gapClip(), gapClip({ id: 'clip-2', sequence: 1 })];
    const tickets = new Map([
      [clips[0].id, ticket('fail')],
      [clips[1].id, ticket('pending')],
    ]);

    await expect(uploadGapClipsWithLimit(clips, tickets))
      .rejects.toMatchObject({ status: 500 });

    expect(ControlledRequest.requests).toHaveLength(2);
    expect(ControlledRequest.requests[1].aborted).toBe(true);
  });

  it('settles when the caller signal is already aborted even if XHR emits no abort', async () => {
    class SilentAbortRequest extends ControlledRequest {
      override abort() { this.aborted = true; }
    }
    vi.stubGlobal('XMLHttpRequest', SilentAbortRequest);
    const clip = gapClip();
    const controller = new AbortController();
    controller.abort();

    await expect(uploadGapClipsWithLimit(
      [clip], new Map([[clip.id, ticket('pending')]]), undefined, controller.signal,
    )).rejects.toThrow('interrotto');
    expect(ControlledRequest.requests).toHaveLength(0);
  });

  it('sends a conditional PUT with the exact signed headers and blob body', async () => {
    class SuccessfulRequest extends ControlledRequest {
      override send(body?: XMLHttpRequestBodyInit | null) {
        super.send(body);
        this.upload.onprogress?.({
          lengthComputable: true,
          loaded: 3,
          total: 3,
        } as ProgressEvent);
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('XMLHttpRequest', SuccessfulRequest);
    const clip = gapClip();
    const progress = vi.fn();

    await uploadGapClipsWithLimit(
      [clip], new Map([[clip.id, putTicket('put')]]), progress,
    );

    const [request] = ControlledRequest.requests;
    expect(request.method).toBe('PUT');
    expect(request.body).toBe(clip.blob);
    expect(Object.fromEntries(request.headers)).toEqual(putTicket('put').fields);
    expect(request.withCredentials).toBe(false);
    expect(progress).toHaveBeenLastCalledWith(expect.objectContaining({
      uploadedBytes: clip.byteLength,
      completedClips: 1,
    }));
  });

  it('treats PUT 412 as already present without overwriting or retrying it', async () => {
    class AlreadyPresentRequest extends ControlledRequest {
      override status = 412;
      override send(body?: XMLHttpRequestBodyInit | null) {
        this.body = body ?? null;
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('XMLHttpRequest', AlreadyPresentRequest);
    const clip = gapClip();

    await expect(uploadGapClipsWithLimit(
      [clip], new Map([[clip.id, putTicket('exists')]]),
    )).resolves.toBeUndefined();
    expect(ControlledRequest.requests).toHaveLength(1);
  });

  it('keeps PUT 403 retryable so init can issue a fresh capability', async () => {
    class ExpiredTicketRequest extends ControlledRequest {
      override status = 403;
      override send(body?: XMLHttpRequestBodyInit | null) {
        this.body = body ?? null;
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('XMLHttpRequest', ExpiredTicketRequest);
    const clip = gapClip();

    const failure = await uploadGapClipsWithLimit(
      [clip], new Map([[clip.id, putTicket('expired')]]),
    ).catch((error: unknown) => error);

    expect(failure).toMatchObject({ status: 403 });
    expect(isRetryableGapUploadError(failure)).toBe(true);
  });

  it('keeps PUT 409 retryable after an S3 conditional-write race', async () => {
    class ConflictingRequest extends ControlledRequest {
      override status = 409;
      override send(body?: XMLHttpRequestBodyInit | null) {
        this.body = body ?? null;
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('XMLHttpRequest', ConflictingRequest);
    const clip = gapClip();

    const failure = await uploadGapClipsWithLimit(
      [clip], new Map([[clip.id, putTicket('conflict')]]),
    ).catch((error: unknown) => error);

    expect(failure).toMatchObject({ status: 409 });
    expect(isRetryableGapUploadError(failure)).toBe(true);
  });

  it('rejects malformed PUT capabilities before starting an XHR', async () => {
    vi.stubGlobal('XMLHttpRequest', ControlledRequest);
    const clip = gapClip();
    const malformed = putTicket('put');
    malformed.fields['If-None-Match'] = 'etag-controlled-by-client';

    await expect(uploadGapClipsWithLimit(
      [clip], new Map([[clip.id, malformed]]),
    )).rejects.toThrow('Capability di upload S3 non valida');
    expect(ControlledRequest.requests).toHaveLength(0);
  });
});
