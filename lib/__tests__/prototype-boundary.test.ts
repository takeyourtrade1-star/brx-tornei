import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = new URL('../../', import.meta.url);
const ROOT_PATH = fileURLToPath(ROOT);
const SOURCE_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx']);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (path === join(ROOT_PATH, 'lib', '__tests__')) return [];
      return sourceFiles(path);
    }
    return entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

describe('prototype deployment boundary', () => {
  it('keeps experimental minigames outside deployable import roots', () => {
    const deployableFiles = ['actions', 'app', 'components', 'hooks', 'lib']
      .flatMap((directory) => sourceFiles(join(ROOT_PATH, directory)))
      .concat(join(ROOT_PATH, 'middleware.ts'));
    const forbiddenImport = /(?:@\/|\.\.?\/)minigioco-test/;
    const violations = deployableFiles
      .filter((path) => forbiddenImport.test(readFileSync(path, 'utf8')))
      .map((path) => relative(ROOT_PATH, path));

    expect(violations).toEqual([]);

    const amplify = readFileSync(new URL('../../amplify.yml', import.meta.url), 'utf8');
    expect(amplify).toMatch(/baseDirectory:\s*\.next/);
    expect(amplify).not.toContain('minigioco-test');
  });

  it('keeps deck identifiers authoritative in the Tournament API', () => {
    const hook = readFileSync(new URL('../../hooks/use-decks.ts', import.meta.url), 'utf8');
    const store = readFileSync(new URL('../data/decks.ts', import.meta.url), 'utf8');
    expect(hook).toContain('createSecureSessionId()');
    expect(store).toContain("tournamentFetch('/api/v1/decks'");
    expect(store).not.toContain('randomUUID()');
    expect(`${hook}\n${store}`).not.toContain('Math.random');
  });
});
