import { afterEach, describe, expect, it, vi } from 'vitest';
import { gapClip } from '@/lib/__tests__/gap-recording-upload-fixtures';
import {
  uploadGapClipsWithLimit,
  type GapUploadTicket,
} from '@/lib/gap-recording/upload-transport';

vi.mock('@/lib/public-config', () => ({
  publicConfig: { storage: { matchGapUploadOrigin: 'http://localhost:8000' } },
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
  constructor() { ControlledRequest.requests.push(this); }
  open(_method: string, url: string) { this.responseURL = url; }
  setRequestHeader() {}
  send() {
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
    url: `http://localhost:8000/${path}`,
    fields: {
      'Content-Type': 'video/webm',
      'X-Ebartex-Gap-Checksum': 'checksum',
      'X-Ebartex-Gap-Ticket': 'ticket',
    },
    transport: 'raw',
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
});
