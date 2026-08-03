import type { OnnxModelIntegrity } from '@/lib/scanner/onnx-loader';

const MAX_CAPABILITIES_BYTES = 64 * 1024;
const MAX_ONNX_MODEL_BYTES = 96 * 1024 * 1024;

export interface ResolvedOnnxModel {
  urls: string[];
  integrity: OnnxModelIntegrity;
}

async function readCapabilities(response: Response): Promise<unknown> {
  const contentEncoding = response.headers.get('content-encoding')?.trim().toLowerCase();
  if (contentEncoding && contentEncoding !== 'identity') {
    await response.body?.cancel().catch(() => undefined);
    throw new Error('Manifest modello compresso non consentito');
  }
  const declared = response.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_CAPABILITIES_BYTES)) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error('Manifest modello oltre il limite');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Manifest modello vuoto');
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_CAPABILITIES_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new Error('Manifest modello oltre il limite');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

/** Resolve an authenticated, backend-authoritative edge-model manifest. */
export async function resolveOnnxModel(
  apiBaseUrl: string,
): Promise<ResolvedOnnxModel> {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const response = await fetch(`${base}/capabilities`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    credentials: 'same-origin',
    redirect: 'error',
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error('Manifest modello non disponibile');
  const payload = await readCapabilities(response);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Manifest modello non valido');
  }
  const edgeModel = (payload as { edge_model?: unknown }).edge_model;
  if (!edgeModel || typeof edgeModel !== 'object' || Array.isArray(edgeModel)) {
    throw new Error('Manifest edge_model assente');
  }
  const { size, sha256 } = edgeModel as {
    size?: unknown;
    sha256?: unknown;
  };
  if (
    !Number.isSafeInteger(size) ||
    Number(size) <= 100_000 ||
    Number(size) > MAX_ONNX_MODEL_BYTES ||
    typeof sha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(sha256)
  ) {
    throw new Error('Integrità edge_model non valida');
  }

  return {
    // Even when the signed manifest advertises a direct URL, model bytes flow
    // through the authenticated same-origin proxy. CSP deliberately permits no
    // direct S3/CDN model connection.
    urls: [`${base}/static/dinov2_small.onnx`],
    integrity: { size: Number(size), sha256 },
  };
}
