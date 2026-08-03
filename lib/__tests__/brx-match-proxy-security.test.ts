import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('BRX Match BFF security contract', () => {
  const source = readFileSync(
    new URL('../../app/brx-match/[...path]/route.ts', import.meta.url),
    'utf8',
  );

  it('allowlists authenticated capabilities and both scoped internal headers', () => {
    expect(source).toContain("path === 'capabilities'");
    expect(source).toContain("rule.upstreamPath === 'capabilities'");
    expect(source).toContain('buildInternalServiceHeaders({');
    expect(source).toContain('rateSubject,');
    expect(source).toContain('readBoundedResponseJson(response, MAX_CAPABILITIES_BYTES)');
    expect(source).toContain("responseKind: 'model', rateLimit: 3, requiresSession: true");
    expect(source).toContain('exactLengthModelStream');
    const internalHeaders = readFileSync(
      new URL('../security/internal-service-headers.ts', import.meta.url),
      'utf8',
    );
    expect(internalHeaders).toContain("'Accept-Encoding': 'identity'");
    expect(source).toContain("'Cache-Control': 'private, max-age=86400, immutable'");
    expect(source).toContain("'Content-Encoding': 'identity'");
    expect(source).toContain("'Content-Type': 'application/octet-stream'");
    expect(source).toContain("'Cross-Origin-Resource-Policy': 'same-origin'");
    expect(source).toContain("'Content-Disposition': 'attachment;");
    expect(source).toContain('pinnedEdgeModelSha256()');
    expect(source).toContain("scope: 'brx-match:health'");
    expect(source).toContain("requiresSession: false, requiresInternalToken: true");
    expect(source).not.toContain("req.headers.get('X-Internal-Rate-Subject')");
    expect(source).not.toMatch(/req\.headers\.get\(['"]x-forwarded-for/i);
  });

  it('requires HTTPS in production and permits only private HTTP development targets', () => {
    expect(source).toContain("process.env.NODE_ENV === 'production'");
    expect(source).toContain('process.env.BRX_MATCH_ALLOWED_ORIGIN');
    expect(source).toContain('configured.origin !== allowed.origin');
    expect(source).toContain("configured.protocol === 'http:'");
    expect(source).not.toMatch(/production[\s\S]*?endsWith\(['"]\./);
  });

  it('uses digest-versioned cache keys and removes the legacy key', () => {
    const loader = readFileSync(
      new URL('../scanner/onnx-loader.ts', import.meta.url),
      'utf8',
    );
    expect(loader).toContain('dinov2_small_sha256_${integrity.sha256}');
    expect(loader).toContain("LEGACY_MODEL_KEYS = ['dinov2_small_v2']");
    expect(loader).toContain('store.delete(legacyKey)');
  });
});
