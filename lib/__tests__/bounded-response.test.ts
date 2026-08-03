import { describe, expect, it, vi } from 'vitest';

import { readBoundedResponseJson } from '@/lib/security/bounded-response';

describe('readBoundedResponseJson', () => {
  it('decodes a bounded JSON response', async () => {
    const response = new Response(JSON.stringify({ ok: true }));
    await expect(readBoundedResponseJson(response, 1024)).resolves.toEqual({ ok: true });
  });

  it('rejects declared and streamed responses over the ceiling', async () => {
    const declared = new Response('{}', {
      headers: { 'content-length': '1025' },
    });
    await expect(readBoundedResponseJson(declared, 1024)).rejects.toThrow(
      'too large',
    );

    const streamed = new Response('x'.repeat(1025));
    await expect(readBoundedResponseJson(streamed, 1024)).rejects.toThrow(
      'too large',
    );
  });

  it('rejects compressed responses before reading their body', async () => {
    const compressed = new Response('compressed', {
      headers: { 'content-encoding': 'gzip' },
    });
    await expect(readBoundedResponseJson(compressed, 1024)).rejects.toThrow(
      'compressed',
    );
  });

  it('cancels bodies rejected from declared length or encoding', async () => {
    for (const headers of [
      { 'content-length': '1025' },
      { 'content-length': 'not-a-number' },
      { 'content-encoding': 'br' },
    ] as Array<Record<string, string>>) {
      const cancel = vi.fn().mockResolvedValue(undefined);
      const response = {
        headers: new Headers(headers),
        body: { cancel },
      } as unknown as Response;
      await expect(readBoundedResponseJson(response, 1024)).rejects.toThrow();
      expect(cancel).toHaveBeenCalledTimes(1);
    }
  });
});
