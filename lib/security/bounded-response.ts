/** Bounded JSON decoding for responses from fixed upstream services. */
export async function readBoundedResponseJson(
  response: Response,
  maxBytes: number,
  signal?: AbortSignal,
): Promise<unknown> {
  const contentEncoding = response.headers.get('content-encoding')?.trim().toLowerCase();
  if (contentEncoding && contentEncoding !== 'identity') {
    await response.body?.cancel('compressed upstream response rejected').catch(() => undefined);
    throw new RangeError('compressed upstream response rejected');
  }
  const declared = response.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
    await response.body?.cancel('invalid or oversized upstream response').catch(() => undefined);
    throw new RangeError('upstream response too large');
  }

  const body = response.body;
  if (!body) return {};
  const reader = body.getReader();
  if (signal?.aborted) {
    void reader.cancel('upstream request aborted').catch(() => undefined);
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException('upstream request aborted', 'AbortError');
  }

  let abortListener: (() => void) | undefined;
  const abortPromise = signal
    ? new Promise<never>((_resolve, reject) => {
        abortListener = () => {
          reject(
            signal.reason instanceof Error
              ? signal.reason
              : new DOMException('upstream request aborted', 'AbortError'),
          );
        };
        signal.addEventListener('abort', abortListener, { once: true });
      })
    : null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const readPromise = reader.read();
      const { done, value } = abortPromise
        ? await Promise.race([readPromise, abortPromise])
        : await readPromise;
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('upstream response too large').catch(() => undefined);
        throw new RangeError('upstream response too large');
      }
      chunks.push(value);
    }
  } catch (error) {
    if (signal?.aborted) {
      void reader.cancel('upstream request aborted').catch(() => undefined);
    }
    throw error;
  } finally {
    if (signal && abortListener) {
      signal.removeEventListener('abort', abortListener);
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(merged);
  return text ? JSON.parse(text) : {};
}
