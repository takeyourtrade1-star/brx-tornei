import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { readBoundedBytes } from '@/lib/security/bounded-json';

function streamRequest(body: ReadableStream<Uint8Array>): Request {
  const init: RequestInit & { duplex: 'half' } = {
    method: 'POST',
    body,
    duplex: 'half',
  };
  return new Request('https://example.test/upload', init);
}

describe('bounded binary request body', () => {
  it('mantiene il cap di byte sullo stream reale', async () => {
    const cancel = vi.fn();
    const request = streamRequest(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2]));
          controller.enqueue(new Uint8Array([3, 4]));
        },
        cancel,
      }),
    );

    await expect(readBoundedBytes(request, 3)).resolves.toEqual({
      ok: false,
      status: 413,
    });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('mantiene il cap di chunk indipendentemente dai byte', async () => {
    const cancel = vi.fn();
    const request = streamRequest(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([1]));
          controller.enqueue(new Uint8Array([2]));
        },
        cancel,
      }),
    );

    await expect(
      readBoundedBytes(request, 10, { maxChunks: 1 }),
    ).resolves.toEqual({ ok: false, status: 413 });
    expect(cancel).toHaveBeenCalledOnce();
  });
});
