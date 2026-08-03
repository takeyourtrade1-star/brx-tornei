import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SENSITIVE_RESPONSE_FILES = [
  'app/api/tornei/webcam/[sessionId]/route.ts',
  'app/api/tournaments/ice-servers/route.ts',
  'lib/webrtc/tournament-signaling-proxy.ts',
] as const;

describe('sensitive API cache boundary', () => {
  it('defines a private no-store JSON response primitive', () => {
    const source = readFileSync(
      new URL('../security/private-json.ts', import.meta.url),
      'utf8',
    );
    expect(source).toContain("headers.set('Cache-Control', PRIVATE_NO_STORE)");
    expect(source).toContain('private, no-store');
  });

  it.each(SENSITIVE_RESPONSE_FILES)(
    'uses the private response primitive for every JSON response in %s',
    (relativePath) => {
      const source = readFileSync(
        new URL(`../../${relativePath}`, import.meta.url),
        'utf8',
      );
      expect(source).toMatch(/privateJson\(/);
      expect(source).not.toMatch(/NextResponse\.json\(/);
    },
  );
});
