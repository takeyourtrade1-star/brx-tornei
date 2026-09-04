import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SECRET_BEARING_FETCH_FILES = [
  'actions/auth.ts',
  'app/api/auth/[...path]/route.ts',
  'app/auth/bridge/sso/callback/route.ts',
  'app/api/tornei/webcam/[sessionId]/authorize/route.ts',
  'app/api/tournaments/ice-servers/route.ts',
  'app/api/tournaments/match/[matchId]/chat-ticket/route.ts',
  'app/api/tournaments/social-room/ticket/route.ts',
  'app/brx-match/[...path]/route.ts',
  'lib/auth/session.ts',
  'lib/data/catalog-cards.ts',
  'lib/data/inventory.ts',
  'lib/data/tournament-api-client.ts',
  'lib/scanner/identify-capture.ts',
  'lib/search/search-request-utils.ts',
  'lib/security/upstash-rest.ts',
  'lib/webrtc/signaling.ts',
  'lib/webrtc/tournament-signaling-proxy.ts',
] as const;

describe('outbound credential redirect gate', () => {
  it('keeps refresh-token rotation out of the server-side auth bridge', () => {
    const source = readFileSync(
      new URL('../../app/auth/bridge/route.ts', import.meta.url),
      'utf8',
    );
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain('/api/auth/refresh');
  });

  it.each(SECRET_BEARING_FETCH_FILES)(
    'requires redirect:error for every sensitive fetch in %s',
    (relativePath) => {
      const source = readFileSync(
        new URL(`../../${relativePath}`, import.meta.url),
        'utf8',
      );
      const fetchCount = source.match(/\bfetch\s*\(/g)?.length ?? 0;
      const redirectErrorCount =
        source.match(/\bredirect\s*:\s*['"]error['"]/g)?.length ?? 0;
      expect(fetchCount).toBeGreaterThan(0);
      expect(redirectErrorCount).toBe(fetchCount);
    },
  );
});
