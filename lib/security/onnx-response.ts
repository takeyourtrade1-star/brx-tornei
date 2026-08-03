const ALLOWED_ONNX_MEDIA_TYPES = new Set([
  'application/octet-stream',
  'application/onnx',
]);

/** Validate only the media type token; parameters never flow to the response. */
export function isAllowedOnnxMediaType(raw: string | null): boolean {
  if (!raw || raw !== raw.trim() || /[\u0000-\u001f\u007f]/.test(raw)) {
    return false;
  }
  const [mediaType, ...parameters] = raw.split(';');
  if (!ALLOWED_ONNX_MEDIA_TYPES.has(mediaType.trim().toLowerCase())) {
    return false;
  }
  return parameters.every((parameter) => parameter.trim().length > 0);
}

export function pinnedEdgeModelSha256(
  environment: NodeJS.ProcessEnv = process.env,
): string | null {
  const raw = environment.BRX_MATCH_EDGE_MODEL_SHA256;
  if (!raw) {
    if (environment.NODE_ENV === 'production') {
      throw new Error('Pinned edge model digest is unavailable');
    }
    return null;
  }
  if (raw !== raw.trim() || !/^[0-9a-f]{64}$/.test(raw)) {
    throw new Error('Pinned edge model digest is invalid');
  }
  return raw;
}
