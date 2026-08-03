type CryptoSource = {
  randomUUID?: () => string;
  getRandomValues?: (bytes: Uint8Array) => Uint8Array;
};

/** Generate a CSPRNG-backed UUID and fail closed if Web Crypto is unavailable. */
export function createSecureSessionId(
  source: CryptoSource = globalThis.crypto as unknown as CryptoSource,
): string {
  if (typeof source?.randomUUID === 'function') {
    try {
      return source.randomUUID();
    } catch {
      // Some embedded browsers expose randomUUID but disable it outside a
      // secure context; getRandomValues remains an acceptable CSPRNG fallback.
    }
  }
  if (typeof source?.getRandomValues !== 'function') {
    throw new Error('Secure random generator unavailable');
  }
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
