import type { GapClipRecord } from '@/lib/gap-recording/types';
import { publicConfig } from '@/lib/public-config';

const UPLOAD_CONCURRENCY = 2;
export const UNAUTHORIZED_UPLOAD_DESTINATION =
  'Destinazione di upload non autorizzata.';

export interface GapUploadTicket {
  url: string;
  fields: Record<string, string>;
  transport: 'multipart' | 'put' | 'raw';
}

export interface GapClipUploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  completedClips: number;
  totalClips: number;
}

export class GapClipUploadError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'GapClipUploadError';
  }
}

function authorizedUploadUrl(ticket: GapUploadTicket): {
  uploadUrl: URL;
  isLoopbackRawUpload: boolean;
} {
  const uploadUrl = new URL(ticket.url);
  const isLoopbackRawUpload = process.env.NODE_ENV !== 'production' &&
    ticket.transport === 'raw' && uploadUrl.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(uploadUrl.hostname.toLowerCase());
  if (
    uploadUrl.origin !== publicConfig.storage.matchGapUploadOrigin ||
    (uploadUrl.protocol !== 'https:' && !isLoopbackRawUpload) ||
    uploadUrl.username || uploadUrl.password
  ) {
    // Keep the request fail-closed, but allow a later init to obtain a
    // corrected capability without discarding the local evidence.
    throw new GapClipUploadError(UNAUTHORIZED_UPLOAD_DESTINATION, null, true);
  }
  return { uploadUrl, isLoopbackRawUpload };
}

function uploadBody(
  clip: GapClipRecord,
  ticket: GapUploadTicket,
  isLoopbackRawUpload: boolean,
): { body: XMLHttpRequestBodyInit; headers: Record<string, string> } {
  if (ticket.transport === 'raw') {
    const expectedFields = new Set([
      'Content-Type',
      'X-Ebartex-Gap-Checksum',
      'X-Ebartex-Gap-Ticket',
    ]);
    const entries = Object.entries(ticket.fields);
    if (
      !isLoopbackRawUpload ||
      entries.length !== expectedFields.size ||
      entries.some(([key, value]) => !expectedFields.has(key) || !value)
    ) {
      throw new GapClipUploadError('Capability di upload locale non valida.');
    }
    return { body: clip.blob, headers: ticket.fields };
  }
  if (ticket.transport === 'put') {
    const expected = new Set([
      'content-type',
      'if-none-match',
      'x-amz-checksum-sha256',
      'x-amz-server-side-encryption',
    ]);
    const normalized = new Map(
      Object.entries(ticket.fields).map(([key, value]) => [key.toLowerCase(), value]),
    );
    if (
      Object.keys(ticket.fields).length !== expected.size ||
      normalized.size !== expected.size ||
      [...normalized.keys()].some((key) => !expected.has(key)) ||
      normalized.get('content-type')?.toLowerCase() !== clip.mimeType.toLowerCase() ||
      normalized.get('if-none-match') !== '*' ||
      !/^[A-Za-z0-9+/]{43}=$/.test(normalized.get('x-amz-checksum-sha256') ?? '') ||
      normalized.get('x-amz-server-side-encryption') !== 'AES256'
    ) {
      throw new GapClipUploadError('Capability di upload S3 non valida.');
    }
    return { body: clip.blob, headers: ticket.fields };
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(ticket.fields)) form.append(key, value);
  const extension = clip.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  form.append('file', clip.blob, `${clip.sequence.toString().padStart(2, '0')}.${extension}`);
  return { body: form, headers: {} };
}

function uploadClip(
  clip: GapClipRecord,
  ticket: GapUploadTicket,
  onProgress: (loaded: number, total: number) => void,
  signal: AbortSignal,
): Promise<void> {
  const { uploadUrl, isLoopbackRawUpload } = authorizedUploadUrl(ticket);
  const { body, headers } = uploadBody(clip, ticket, isLoopbackRawUpload);
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', abort);
      callback();
    };
    const abort = () => {
      request.abort();
      finish(() => reject(
        new GapClipUploadError('Upload della clip interrotto.', null, true),
      ));
    };
    request.open(ticket.transport === 'put' ? 'PUT' : 'POST', ticket.url, true);
    request.timeout = 60_000;
    request.withCredentials = false;
    for (const [key, value] of Object.entries(headers)) request.setRequestHeader(key, value);
    request.upload.onprogress = (event) => {
      const total = event.lengthComputable ? event.total : Math.max(clip.byteLength, event.loaded);
      onProgress(event.loaded, total);
    };
    request.onload = () => {
      if (request.responseURL && new URL(request.responseURL).origin !== uploadUrl.origin) {
        finish(() => reject(new GapClipUploadError('Redirect di upload non autorizzato.')));
      } else if (
        (request.status >= 200 && request.status < 300) ||
        (ticket.transport === 'put' && request.status === 412)
      ) {
        // A conditional PUT returning 412 proves the key already exists and
        // did not overwrite it. Finalize performs the authoritative HEAD
        // checksum/size/type verification before accepting the recording.
        finish(resolve);
      } else {
        finish(() => reject(
          new GapClipUploadError('Upload di una clip non riuscito.', request.status),
        ));
      }
    };
    request.onerror = () => finish(() => reject(
      new GapClipUploadError('Connessione allo storage interrotta.', null, true),
    ));
    request.ontimeout = () => finish(() => reject(
      new GapClipUploadError('Upload della clip scaduto.', null, true),
    ));
    request.onabort = () => finish(() => reject(
      new GapClipUploadError('Upload della clip interrotto.', null, true),
    ));
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    request.send(body);
  });
}

export async function uploadGapClipsWithLimit(
  clips: GapClipRecord[],
  tickets: Map<string, GapUploadTicket>,
  onProgress?: (progress: GapClipUploadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  for (const clip of clips) {
    if (!tickets.has(clip.id)) throw new GapClipUploadError('Capability di upload mancante.');
  }
  let index = 0;
  let firstFailure: unknown;
  const abortController = new AbortController();
  const abortFromCaller = () => abortController.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });
  if (signal?.aborted) abortController.abort();
  const progress = new Map(
    clips.map((clip) => [clip.id, { loaded: 0, total: clip.byteLength }]),
  );
  const completed = new Set<string>();
  const emit = () => onProgress?.({
    uploadedBytes: [...progress.values()].reduce((sum, item) => sum + item.loaded, 0),
    totalBytes: [...progress.values()].reduce((sum, item) => sum + item.total, 0),
    completedClips: completed.size,
    totalClips: clips.length,
  });
  emit();

  async function worker() {
    while (!abortController.signal.aborted && index < clips.length) {
      const clip = clips[index];
      index += 1;
      const ticket = tickets.get(clip.id)!;
      try {
        await uploadClip(clip, ticket, (loaded, total) => {
          progress.set(clip.id, { loaded: Math.min(loaded, total), total });
          emit();
        }, abortController.signal);
      } catch (error) {
        if (firstFailure === undefined) firstFailure = error;
        abortController.abort();
        throw error;
      }
      const current = progress.get(clip.id) ?? { loaded: 0, total: clip.byteLength };
      progress.set(clip.id, { loaded: current.total, total: current.total });
      completed.add(clip.id);
      emit();
    }
  }
  await Promise.allSettled(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, clips.length) }, () => worker()),
  );
  signal?.removeEventListener('abort', abortFromCaller);
  if (firstFailure !== undefined) throw firstFailure;
  if (abortController.signal.aborted) {
    throw new GapClipUploadError('Upload delle clip interrotto.', null, true);
  }
}
