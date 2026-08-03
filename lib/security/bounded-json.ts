import 'server-only';

export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 };

export type BoundedTextResult =
  | { ok: true; value: string }
  | { ok: false; status: 400 | 413 };

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
): Promise<BoundedTextResult> {
  const rawLength = request.headers.get('content-length');
  if (rawLength !== null) {
    if (!/^\d+$/.test(rawLength)) return { ok: false, status: 400 };
    if (Number(rawLength) > maxBytes) return { ok: false, status: 413 };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400 };

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
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
): Promise<BoundedJsonResult> {
  const body = await readBoundedText(request, maxBytes);
  if (!body.ok) return body;
  try {
    return { ok: true, value: JSON.parse(body.value) };
  } catch {
    return { ok: false, status: 400 };
  }
}
