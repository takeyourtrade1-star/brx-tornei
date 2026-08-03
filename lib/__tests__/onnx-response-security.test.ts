import { describe, expect, it } from 'vitest';

import {
  isAllowedOnnxMediaType,
  pinnedEdgeModelSha256,
} from '@/lib/security/onnx-response';

describe('ONNX response boundary', () => {
  it.each([
    'application/octet-stream',
    'application/onnx',
    'application/onnx; charset=binary',
  ])('accepts an explicit model media type: %s', (value) => {
    expect(isAllowedOnnxMediaType(value)).toBe(true);
  });

  it.each([
    null,
    'text/html',
    'image/svg+xml',
    'text/javascript',
    'application/octet-stream\ntext/html',
    ' application/octet-stream',
    'application/octet-stream;',
  ])('rejects an executable, missing, or ambiguous media type: %s', (value) => {
    expect(isAllowedOnnxMediaType(value)).toBe(false);
  });

  it('requires an independent lowercase artifact digest in production', () => {
    const sha256 = 'a'.repeat(64);
    expect(
      pinnedEdgeModelSha256({
        NODE_ENV: 'production',
        BRX_MATCH_EDGE_MODEL_SHA256: sha256,
      }),
    ).toBe(sha256);
    expect(() => pinnedEdgeModelSha256({ NODE_ENV: 'production' })).toThrow(
      'unavailable',
    );
    expect(() =>
      pinnedEdgeModelSha256({
        NODE_ENV: 'production',
        BRX_MATCH_EDGE_MODEL_SHA256: 'A'.repeat(64),
      }),
    ).toThrow('invalid');
  });
});
