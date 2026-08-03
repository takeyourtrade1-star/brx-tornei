import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { isJsonContentType, readBoundedJson } from '@/lib/security/bounded-json';

describe('readBoundedJson', () => {
  it.each([
    'application/json',
    'application/json; charset=utf-8',
    'Application/JSON; Charset="UTF-8"',
  ])('accetta esclusivamente JSON UTF-8: %s', (value) => {
    expect(isJsonContentType(value)).toBe(true);
  });

  it.each([
    null,
    'text/plain',
    'application/jsonp',
    'application/json; charset=iso-8859-1',
    'application/json; profile=x',
  ])('rifiuta media type ambiguo o non JSON: %s', (value) => {
    expect(isJsonContentType(value)).toBe(false);
  });
  it('parsa un body entro il limite', async () => {
    const result = await readBoundedJson(
      new Request('https://tornei.ebartex.com/api/test', {
        method: 'POST',
        body: JSON.stringify({ ids: [1, 2] }),
      }),
      1024,
    );
    expect(result).toEqual({ ok: true, value: { ids: [1, 2] } });
  });

  it('rifiuta Content-Length oltre il limite prima della lettura', async () => {
    const result = await readBoundedJson(
      new Request('https://tornei.ebartex.com/api/test', {
        method: 'POST',
        headers: { 'Content-Length': '2048' },
        body: '{}',
      }),
      1024,
    );
    expect(result).toEqual({ ok: false, status: 413 });
  });

  it('ferma anche un body chunked senza Content-Length', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"x":"'));
        controller.enqueue(new Uint8Array(2048));
        controller.enqueue(new TextEncoder().encode('"}'));
        controller.close();
      },
    });
    const result = await readBoundedJson(
      new Request('https://tornei.ebartex.com/api/test', {
        method: 'POST',
        body: stream,
        duplex: 'half',
      } as RequestInit & { duplex: 'half' }),
      1024,
    );
    expect(result).toEqual({ ok: false, status: 413 });
  });
});
