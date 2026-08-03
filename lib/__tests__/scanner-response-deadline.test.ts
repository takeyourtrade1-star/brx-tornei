import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('scanner response deadline contract', () => {
  it('keeps abort signals active through bounded streamed body reads', () => {
    const source = readFileSync(
      new URL('../scanner/identify-capture.ts', import.meta.url),
      'utf8',
    );
    expect(source).not.toMatch(/clearTimeout\(timeoutId\);\s*\n\s*if \(!(?:searchResp|resp)\.ok\)/);
    expect(source.match(/readBoundedResponseJson\(/g)).toHaveLength(3);
    expect(source).not.toMatch(/\.(?:json|text|arrayBuffer)\(\)/);
  });
});
