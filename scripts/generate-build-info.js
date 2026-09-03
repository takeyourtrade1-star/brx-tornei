const { execSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

function getGitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      cwd: process.cwd(),
    }).trim();
    const timestamp = Number.parseInt(
      execSync('git log -1 --format=%ct', {
        encoding: 'utf8',
        cwd: process.cwd(),
      }).trim(),
      10,
    );
    return { hash, timestamp };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Impossibile leggere info git, fallback a dev:', message);
    return { hash: 'dev', timestamp: null };
  }
}

const outPath = path.join(process.cwd(), 'public', 'build-info.json');
mkdirSync(path.dirname(outPath), { recursive: true });
const info = getGitInfo();
writeFileSync(outPath, `${JSON.stringify(info, null, 2)}\n`);
console.log('✅ Build info scritto:', info);
