import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('browser signaling credential boundary', () => {
  it('non accetta né inoltra bearer token dal client', () => {
    for (const relative of (
      [
        '../webrtc/signaling.ts',
        '../webrtc/webcam-link.ts',
        '../../hooks/use-webcam-receiver.ts',
        '../../components/feature/tornei/webcam-link-modal.tsx',
        '../../components/feature/tornei/webcam-phone-publisher.tsx',
      ] as const
    )) {
      const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
      expect(source, relative).not.toMatch(/bearerToken|relayToken|hostToken/i);
      expect(source, relative).not.toMatch(/['"]Authorization['"]\s*:/i);
      expect(source, relative).not.toMatch(/Bearer\s+\$\{/i);
    }
  });

  it('conserva le capability solo in cookie HttpOnly scoped', () => {
    for (const relative of (
      [
        '../../app/api/tornei/webcam/[sessionId]/authorize/route.ts',
        '../../app/api/tornei/webcam/[sessionId]/claim/route.ts',
      ] as const
    )) {
      const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
      expect(source, relative).toContain('httpOnly: true');
      expect(source, relative).toContain("sameSite: 'strict'");
      expect(source, relative).not.toMatch(/json\(\{\s*(?:hostToken|token)\b/);
    }
  });
});
