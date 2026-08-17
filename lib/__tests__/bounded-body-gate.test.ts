import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const BOUNDED_HANDLER_FILES = [
  'app/api/auth/[...path]/route.ts',
  'app/api/cards-by-blueprints/route.ts',
  'app/api/cards/resolve-scan/route.ts',
  'app/api/decks/validate-legality/route.ts',
  'app/api/tornei/webcam/[sessionId]/claim/route.ts',
  'app/api/tornei/webcam/[sessionId]/route.ts',
  'lib/webrtc/tournament-signaling-proxy.ts',
] as const;

describe('bounded request-body gate', () => {
  it.each(BOUNDED_HANDLER_FILES)('streams and caps bodies in %s', (relativePath) => {
    const source = readFileSync(
      new URL(`../../${relativePath}`, import.meta.url),
      'utf8',
    );
    expect(source).toMatch(/(?:readBounded(?:Json|Text)|readAuthRequestBody)\(/);
    expect(source).not.toMatch(/\b(?:request|req)\.(?:text|json|arrayBuffer)\(/);
  });
});
