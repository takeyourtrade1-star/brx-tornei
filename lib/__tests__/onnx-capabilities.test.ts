import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveOnnxModel } from '@/hooks/resolveOnnxUrls';

describe('authenticated ONNX capabilities manifest', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('accepts only the canonical top-level edge_model contract', async () => {
    const sha256 = 'a'.repeat(64);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({
          status: 'ok',
          pipeline_version: 'v3',
          model_loaded: true,
          index_ready: true,
          edge_model: { size: 87_654_321, sha256 },
        })),
      ),
    );
    await expect(resolveOnnxModel('/brx-match')).resolves.toEqual({
      urls: ['/brx-match/static/dinov2_small.onnx'],
      integrity: { size: 87_654_321, sha256 },
    });
  });

  it('accepts the real model size without allocating model bytes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({
          status: 'ok',
          pipeline_version: 'v3',
          model_loaded: true,
          index_ready: true,
          edge_model: { size: 87_654_321, sha256: 'b'.repeat(64) },
        })),
      ),
    );
    await expect(resolveOnnxModel('/brx-match')).resolves.toMatchObject({
      integrity: { size: 87_654_321 },
    });
  });

  it('rejects an envelope, uppercase digest, and oversized manifest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({
          data: { edge_model: { size: 25_000_000, sha256: 'a'.repeat(64) } },
        })),
      ),
    );
    await expect(resolveOnnxModel('/brx-match')).rejects.toThrow('edge_model');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({
          edge_model: { size: 25_000_000, sha256: 'A'.repeat(64) },
        })),
      ),
    );
    await expect(resolveOnnxModel('/brx-match')).rejects.toThrow('Integrità');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('{}', {
          headers: { 'content-length': String(64 * 1024 + 1) },
        }),
      ),
    );
    await expect(resolveOnnxModel('/brx-match')).rejects.toThrow('limite');
  });

  it('rejects compressed capabilities before decoding them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('{}', { headers: { 'content-encoding': 'gzip' } }),
      ),
    );
    await expect(resolveOnnxModel('/brx-match')).rejects.toThrow('compresso');
  });
});
