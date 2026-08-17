import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
}

describe('auth form synchronous submit guards', () => {
  it.each([
    'components/feature/auth/login-form.tsx',
    'components/feature/auth/verify-mfa-form.tsx',
  ])('blocca il doppio submit nello stesso tick prima della transition: %s', (path) => {
    const contents = source(path);
    const guard = contents.indexOf('if (submitInFlightRef.current) return;');
    const lock = contents.indexOf('submitInFlightRef.current = true;', guard);
    const transition = contents.indexOf('startTransition(async () => {', lock);

    expect(contents).toContain('const submitInFlightRef = useRef(false);');
    expect(guard).toBeGreaterThan(-1);
    expect(lock).toBeGreaterThan(guard);
    expect(transition).toBeGreaterThan(lock);
    expect(contents).toMatch(/finally \{\s*submitInFlightRef\.current = false;/);
  });
});
