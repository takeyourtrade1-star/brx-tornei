import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { isJsonContentType, readBoundedJson } from '@/lib/security/bounded-json';

describe('readBoundedJson', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('interrompe un body che non termina entro la deadline', async () => {
    vi.useFakeTimers();
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        return new Promise<void>(() => undefined);
      },
    });
    const pending = readBoundedJson(
      new Request('https://tornei.ebartex.com/api/test', {
        method: 'POST',
        body: stream,
        duplex: 'half',
      } as RequestInit & { duplex: 'half' }),
      1024,
      { timeoutMs: 25 },
    );

    await vi.advanceTimersByTimeAsync(25);
    await expect(pending).resolves.toEqual({ ok: false, status: 408 });
  });

  it('tratta l’abort della request come timeout e non attende altri chunk', async () => {
    const controller = new AbortController();
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        return new Promise<void>(() => undefined);
      },
    });
    const pending = readBoundedJson(
      new Request('https://tornei.ebartex.com/api/test', {
        method: 'POST',
        body: stream,
        signal: controller.signal,
        duplex: 'half',
      } as RequestInit & { duplex: 'half' }),
      1024,
    );
    controller.abort();
    await expect(pending).resolves.toEqual({ ok: false, status: 408 });
  });

  it('limita il numero di chunk anche quando il totale byte è piccolo', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{'));
        controller.enqueue(new TextEncoder().encode('}'));
        controller.enqueue(new Uint8Array());
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
      { maxChunks: 2 },
    );
    expect(result).toEqual({ ok: false, status: 413 });
  });
});
