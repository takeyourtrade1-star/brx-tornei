import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT_PATH = fileURLToPath(new URL('../../', import.meta.url));

function source(path: string): string {
  return readFileSync(join(ROOT_PATH, path), 'utf8');
}

describe('fluidita delle pagine torneo', () => {
  it('carica i video formato soltanto al primo hover', () => {
    const selector = source('components/feature/tornei/format-selector-grid.tsx');

    expect(selector).toContain('data-src={format.video}');
    expect(selector).toContain('preload="none"');
    expect(selector).toContain("video.src = video.dataset.src");
    expect(selector).toContain("video.removeAttribute('src')");
    expect(selector).toContain("window.matchMedia('(hover: hover) and (pointer: fine)')");
    expect(selector).not.toMatch(/\n\s+src=\{format\.video\}/);
    expect(selector).toContain('src={format.thumbnail}');
    expect(selector).toContain('unoptimized');
  });

  it('usa otto miniature formato entro un budget complessivo di 200 KB', () => {
    const directory = join(ROOT_PATH, 'public/immagini-formato-orizzontale/thumbs');
    const thumbnails = readdirSync(directory).filter((name) => name.endsWith('.webp'));
    const totalBytes = thumbnails.reduce(
      (total, name) => total + statSync(join(directory, name)).size,
      0,
    );

    expect(thumbnails).toHaveLength(8);
    expect(totalBytes).toBeLessThanOrEqual(200 * 1024);
  });

  it('usa il realtime prima del polling e sospende il refresh sotto Arcade', () => {
    const lobby = source('components/feature/tornei/lobby/lobby-page.tsx');
    const realtime = source('hooks/use-tournament-realtime-refresh.ts');

    expect(lobby).toContain('(trackedTournament && realtimeConnected)');
    expect(lobby).toContain('trackedTournament ? 15_000 : 30_000');
    expect(lobby).toContain('arcadeGateOpen || arcadeOpen');
    expect(realtime).toContain('onConnectionStateChange?.(true)');
  });

  it('mantiene ferme le animazioni decorative fuori dall interazione', () => {
    const styles = source('app/globals.css');
    const atmosphere = source('components/layout/arena-atmosphere.tsx');

    expect(styles).toContain('.profile-rank-badge *');
    expect(styles).toContain('.motion-static-icons *');
    expect(styles).toContain('body:has(.home-playmat-backdrop) .arena-atmosphere');
    expect(styles).toContain('.arena-atmosphere .pt-ember');
    expect(atmosphere.match(/\{ left:/g)).toHaveLength(6);
  });
});
