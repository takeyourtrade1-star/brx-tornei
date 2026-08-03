import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const ROOT = new URL('../../', import.meta.url);

describe('prototype deployment boundary', () => {
  it('keeps experimental minigames outside deployable import roots', () => {
    const scan = spawnSync(
      'rg',
      [
        '-n',
        '--glob',
        '!lib/__tests__/**',
        String.raw`(?:@/|\.\.?/)minigioco-test`,
        'actions',
        'app',
        'components',
        'hooks',
        'lib',
        'middleware.ts',
      ],
      { cwd: ROOT, encoding: 'utf8' },
    );
    expect(scan.error).toBeUndefined();
    expect(scan.status).toBe(1);
    expect(scan.stdout.trim()).toBe('');
  });

  it('uses cryptographic deck identifiers on client and server', () => {
    const hook = readFileSync(new URL('../../hooks/use-decks.ts', import.meta.url), 'utf8');
    const store = readFileSync(new URL('../data/decks.ts', import.meta.url), 'utf8');
    expect(hook).toContain('createSecureSessionId()');
    expect(store).toContain('randomUUID()');
    expect(`${hook}\n${store}`).not.toContain('Math.random');
  });
});
