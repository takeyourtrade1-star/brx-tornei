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

describe('arcade deployment boundary', () => {
  it('allows only the approved secondary arcade entry point', () => {
    const deployableFiles = ['actions', 'app', 'components', 'hooks', 'lib']
      .flatMap((directory) => sourceFiles(join(ROOT_PATH, directory)))
      .concat(join(ROOT_PATH, 'middleware.ts'));
    const forbiddenImport = /(?:@\/|\.\.?\/)minigioco-test/;
    const approvedEntryPoint = 'components/feature/tornei/lobby/arcade-room-launcher.tsx';
    const violations = deployableFiles
      .filter((path) => forbiddenImport.test(readFileSync(path, 'utf8')))
      .map((path) => relative(ROOT_PATH, path));

    expect(violations).toEqual([approvedEntryPoint]);
    expect(readFileSync(join(ROOT_PATH, approvedEntryPoint), 'utf8')).toContain(
      "dynamic(() => import('@/minigioco-test/IsoRoomGame')",
    );

    const amplify = readFileSync(new URL('../../amplify.yml', import.meta.url), 'utf8');
    expect(amplify).toMatch(/baseDirectory:\s*\.next/);
    expect(amplify).not.toContain('minigioco-test');
  });

  it('pins every remote demo script and verifies it with SRI', () => {
    const demo = readFileSync(new URL('../../minigioco-test/demo.html', import.meta.url), 'utf8');
    const remoteScripts = [...demo.matchAll(/<script\b([^>]*\bsrc="https:\/\/[^">]+"[^>]*)>/g)];

    expect(remoteScripts).toHaveLength(3);
    expect(demo).not.toMatch(/react(?:-dom)?@18\//);
    expect(demo).not.toContain('@babel/standalone/babel.min.js');
    for (const [, attributes] of remoteScripts) {
      expect(attributes).toMatch(/\bintegrity="sha384-[A-Za-z0-9+/=]+"/);
      expect(attributes).toContain('crossorigin="anonymous"');
    }
  });

  it('keeps deck identifiers authoritative in the Tournament API', () => {
    const hook = readFileSync(new URL('../../hooks/use-decks.ts', import.meta.url), 'utf8');
    const store = readFileSync(new URL('../data/decks.ts', import.meta.url), 'utf8');
    expect(hook).toContain('createSecureSessionId()');
    expect(store).toContain("tournamentFetch('/api/v1/decks'");
    expect(store).not.toContain('randomUUID()');
    expect(`${hook}\n${store}`).not.toContain('Math.random');
  });

  it('mantiene gli style inline arcade sotto la CSP per-request', () => {
    const nonceHelper = readFileSync(join(ROOT_PATH, 'minigioco-test', 'csp-nonce.js'), 'utf8');
    expect(nonceHelper).toContain('getCspNonce');

    const arcadeFiles = [
      'minigioco-test/world-client/world-styles.js',
      'minigioco-test/arcade-room/ArcadeGameModal.jsx',
      'minigioco-test/arcade-room/CardMemoryGame.jsx',
      'minigioco-test/arcade-room/KakeguruiGame.jsx',
      'minigioco-test/arcade-room/TcgJumpGame.jsx',
    ];
    for (const file of arcadeFiles) {
      const source = readFileSync(join(ROOT_PATH, file), 'utf8');
      expect(source).toContain('getCspNonce');
    }
    const room = readFileSync(join(ROOT_PATH, 'minigioco-test/world-client/world-styles.js'), 'utf8');
    expect(room).toContain("style.setAttribute('nonce', nonce)");
    expect(room).not.toContain('fonts.googleapis.com');
  });

  it('isola il WebRTC sperimentale dalla superficie arcade del sito', () => {
    const modal = readFileSync(
      join(ROOT_PATH, 'minigioco-test/arcade-room/ArcadeGameModal.jsx'),
      'utf8',
    );
    const duel = readFileSync(
      join(ROOT_PATH, 'minigioco-test/arcade-room/KakeguruiGame.jsx'),
      'utf8',
    );
    const room = readFileSync(join(ROOT_PATH, 'minigioco-test/IsoRoomGame.jsx'), 'utf8');

    expect(modal).toContain('integrationMode');
    expect(duel).toContain('integrationMode !== "site"');
    expect(room).toContain('integrationMode={integrationMode}');
  });

  it('usa nelle superfici Arcade gli stessi componenti ufficiali correnti', () => {
    const room = readFileSync(join(ROOT_PATH, 'minigioco-test', 'IsoRoomGame.jsx'), 'utf8');
    const launcher = readFileSync(
      join(ROOT_PATH, 'components', 'feature', 'tornei', 'lobby', 'arcade-room-launcher.tsx'),
      'utf8',
    );
    const mirror = readFileSync(
      join(ROOT_PATH, 'components', 'feature', 'tornei', 'lobby', 'arcade-official-modal.tsx'),
      'utf8',
    );
    const deckWorkspace = readFileSync(
      join(ROOT_PATH, 'components', 'feature', 'decks', 'deck-workspace.tsx'),
      'utf8',
    );
    const decksPage = readFileSync(
      join(ROOT_PATH, 'components', 'feature', 'decks', 'mazzi-workspace.tsx'),
      'utf8',
    );

    expect(room).toContain('onOpenTournaments');
    expect(room).toContain('onOpenCreateTournament');
    const controls = readFileSync(join(ROOT_PATH, 'minigioco-test/world-client/use-world-controls.js'), 'utf8');
    expect(controls).toContain("new Set(['pc', 'board', 'decks'])");
    expect(controls).toContain('onOpenDecks');
    expect(controls).toContain('gameRef.current?.zoomOut()');
    expect(room).not.toContain('function PcModal');
    expect(room).not.toContain('function BoardModal');
    expect(room).not.toContain('<DecksModal');
    expect(room).not.toContain('handlePublish');
    expect(room).not.toContain('handleJoin');
    expect(room).not.toContain('irg-m-pc');
    expect(room).not.toContain('irg-m-board');
    expect(room).not.toContain('irg-m-decks');
    expect(launcher).toContain('<ArcadeOfficialModal');
    expect(launcher).not.toContain("router.push('/mazzi')");
    expect(mirror).toContain("import { TableCard } from './table-card'");
    expect(mirror).toContain("import { DeckWorkspace } from '@/components/feature/decks/deck-workspace'");
    expect(deckWorkspace).toContain('useServerDecks(initialDecks');
    expect(decksPage).toContain('<DeckWorkspace initialDecks={initialDecks}');
  });
});
