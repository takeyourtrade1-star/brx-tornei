const SECRET_FIELDS = new Set([
  'access_token',
  'refresh_token',
  'pre_auth_token',
  'id_token',
  'token',
]);

/** Remove credentials recursively before an upstream JSON body reaches a browser. */
export function redactAuthPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuthPayload);
  if (!value || typeof value !== 'object') return value;
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (!SECRET_FIELDS.has(key.toLowerCase())) {
      output[key] = redactAuthPayload(child);
    }
  }
  return output;
}
