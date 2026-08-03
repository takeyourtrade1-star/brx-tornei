import { describe, expect, it } from 'vitest';

import { createSecureSessionId } from '@/lib/security/random-session-id';

describe('secure webcam session ids', () => {
  it('uses a CSPRNG fallback and emits a v4 UUID', () => {
    const source = {
      getRandomValues(bytes: Uint8Array) {
        bytes.fill(0xab);
        return bytes;
      },
    };
    expect(createSecureSessionId(source)).toBe(
      'abababab-abab-4bab-abab-abababababab',
    );
  });

  it('fails closed without Web Crypto', () => {
    expect(() => createSecureSessionId({})).toThrow('Secure random');
  });
});
