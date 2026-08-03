import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../..');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const target = path.join(directory, name);
    if (name === 'node_modules' || name === '.next') return [];
    if (statSync(target).isDirectory()) return sourceFiles(target);
    return /\.(?:ts|tsx)$/.test(name) ? [target] : [];
  });
}

describe('client/server configuration boundary', () => {
  it('prevents use-client modules from importing the server config graph', () => {
    for (const base of ['app', 'components', 'hooks', 'lib']) {
      for (const file of sourceFiles(path.join(ROOT, base))) {
        const source = readFileSync(file, 'utf8');
        if (!/^\s*['"]use client['"]/.test(source)) continue;
        expect(source, file).not.toMatch(/@\/lib\/(?:config|meilisearch-server-env)/);
      }
    }
  });

  it('keeps REST origins and credentials out of public config', () => {
    const publicSource = readFileSync(path.join(ROOT, 'lib/public-config.ts'), 'utf8');
    expect(publicSource).not.toMatch(
      /AUTH_API_URL|SYNC_API_URL|TOURNAMENTS_API_URL|MEILISEARCH|UPSTASH|INTERNAL_TOKEN|SEARCH_KEY/,
    );
    const serverSource = readFileSync(path.join(ROOT, 'lib/config.ts'), 'utf8');
    expect(serverSource).toContain("import 'server-only'");
    expect(serverSource).not.toMatch(/NEXT_PUBLIC_(?:AUTH|SYNC|TOURNAMENTS_API|MEILISEARCH)/);
  });

  it('runs a post-build client bundle leak gate in CI', () => {
    const workflow = readFileSync(
      path.join(ROOT, '.github/workflows/security-ci.yml'),
      'utf8',
    );
    expect(workflow).toContain('node scripts/assert-client-bundle.mjs');
  });
});
