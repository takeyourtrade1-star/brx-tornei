import 'server-only';

export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 408 | 413 };

export type BoundedTextResult =
  | { ok: true; value: string }
  | { ok: false; status: 400 | 408 | 413 };

export interface BoundedBodyReadOptions {
  timeoutMs?: number;
  maxChunks?: number;
}

export const DEFAULT_BODY_READ_TIMEOUT_MS = 10_000;
export const DEFAULT_BODY_CHUNK_LIMIT = 256;

type ReadChunkResult =
  | { timedOut: true }
  | { timedOut: false; value: ReadableStreamReadResult<Uint8Array> };

function readChunkBeforeDeadline(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal,
  deadline: number,
): Promise<ReadChunkResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (result: ReadChunkResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      resolve(result);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(error);
    };
    const onAbort = () => finish({ timedOut: true });
    const timer = setTimeout(
      () => finish({ timedOut: true }),
      Math.max(0, deadline - Date.now()),
    );

    if (signal.aborted) {
      finish({ timedOut: true });
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
    reader.read().then(
      (value) => finish({ timedOut: false, value }),
      fail,
    );
  });
}

/** Accept JSON only, with an optional UTF-8 charset and no extra parameters. */
export function isJsonContentType(value: string | null): boolean {
  if (value === null) return false;
  return /^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i.test(
    value.trim(),
  );
}

/**
 * Parse JSON without ever buffering more than `maxBytes` from a chunked body.
 * Content-Length is only an early rejection: the streaming ceiling remains
 * authoritative because clients can omit or lie about that header.
 */
export async function readBoundedText(
  request: Request,
  maxBytes: number,
  options: BoundedBodyReadOptions = {},
): Promise<BoundedTextResult> {
  const rawLength = request.headers.get('content-length');
  if (rawLength !== null) {
    if (!/^\d+$/.test(rawLength)) return { ok: false, status: 400 };
    if (Number(rawLength) > maxBytes) return { ok: false, status: 413 };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400 };

  const timeoutMs =
    typeof options.timeoutMs === 'number' &&
    Number.isFinite(options.timeoutMs) &&
    options.timeoutMs > 0
      ? Math.floor(options.timeoutMs)
      : DEFAULT_BODY_READ_TIMEOUT_MS;
  const maxChunks =
    typeof options.maxChunks === 'number' &&
    Number.isFinite(options.maxChunks) &&
    options.maxChunks > 0
      ? Math.floor(options.maxChunks)
      : DEFAULT_BODY_CHUNK_LIMIT;
  const deadline = Date.now() + timeoutMs;
  const chunks: Uint8Array[] = [];
  let total = 0;
  let chunkCount = 0;
  try {
    while (true) {
      const next = await readChunkBeforeDeadline(reader, request.signal, deadline);
      if (next.timedOut) {
        void reader.cancel('request body timed out').catch(() => undefined);
        return { ok: false, status: 408 };
      }
      const { done, value } = next.value;
      if (done) break;
      chunkCount += 1;
      if (chunkCount > maxChunks) {
        void reader.cancel('too many request body chunks').catch(() => undefined);
        return { ok: false, status: 413 };
      }
      total += value.byteLength;
      if (total > maxBytes) {
        void reader.cancel('request body too large').catch(() => undefined);
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: request.signal.aborted ? 408 : 400 };
  }

  const raw = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    raw.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      ok: true,
      value: new TextDecoder('utf-8', { fatal: true }).decode(raw),
    };
  } catch {
    return { ok: false, status: 400 };
  }
}

export async function readBoundedJson(
  request: Request,
  maxBytes: number,
  options: BoundedBodyReadOptions = {},
): Promise<BoundedJsonResult> {
  const body = await readBoundedText(request, maxBytes, options);
  if (!body.ok) return body;
  try {
    return { ok: true, value: JSON.parse(body.value) };
  } catch {
    return { ok: false, status: 400 };
  }
}
