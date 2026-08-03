import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAndCacheOnnxModel,
  MAX_ONNX_MODEL_BYTES,
  verifyOnnxModelIntegrity,
} from '@/lib/scanner/onnx-loader';

describe('ONNX loader memory limits', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the real 87,654,321-byte artifact below a finite 128 MiB ceiling', () => {
    expect(87_654_321).toBeLessThan(MAX_ONNX_MODEL_BYTES);
    expect(MAX_ONNX_MODEL_BYTES).toBeLessThan(128 * 1024 * 1024);
  });

  it('rejects an oversized model from Content-Length before reading its body', async () => {
    const cancel = vi.fn(async () => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      headers: new Headers({
        'content-length': String(MAX_ONNX_MODEL_BYTES + 1),
      }),
      body: { cancel },
    })));

    await expect(
      fetchAndCacheOnnxModel(
        'https://model.example.test/model.onnx',
        { size: 100_001, sha256: 'a'.repeat(64) },
      ),
    ).rejects.toThrow('oltre il limite');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('rejects compressed model bytes and cancels the response body', async () => {
    const cancel = vi.fn(async () => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      headers: new Headers({ 'content-encoding': 'br' }),
      body: { cancel },
    })));

    await expect(
      fetchAndCacheOnnxModel(
        'https://model.example.test/model.onnx',
        { size: 100_001, sha256: 'a'.repeat(64) },
      ),
    ).rejects.toThrow('Content-Encoding');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('requires exact size and SHA-256 before returning executable bytes', async () => {
    const bytes = new Uint8Array(100_001).fill(7);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    const sha256 = [...new Uint8Array(digest)]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(bytes, {
          status: 200,
          headers: { 'content-length': String(bytes.byteLength) },
        }),
      ),
    );

    const model = await fetchAndCacheOnnxModel(
      'https://model.example.test/model.onnx',
      { size: bytes.byteLength, sha256 },
    );
    expect(model.byteLength).toBe(bytes.byteLength);
    await expect(
      verifyOnnxModelIntegrity(model, {
        size: bytes.byteLength,
        sha256: '0'.repeat(64),
      }),
    ).resolves.toBe(false);
  });

  it('rejects a model whose digest differs from the authenticated manifest', async () => {
    const bytes = new Uint8Array(100_001).fill(3);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(bytes, {
          status: 200,
          headers: { 'content-length': String(bytes.byteLength) },
        }),
      ),
    );
    await expect(
      fetchAndCacheOnnxModel('https://model.example.test/model.onnx', {
        size: bytes.byteLength,
        sha256: 'f'.repeat(64),
      }),
    ).rejects.toThrow('SHA-256');
  });
});
