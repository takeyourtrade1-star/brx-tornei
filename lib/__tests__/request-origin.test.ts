import { describe, expect, it } from 'vitest';

import { isSameOriginMutation } from '@/lib/security/request-origin';

const SITE = 'https://tornei.ebartex.com';

describe('same-origin mutation guard', () => {
  it('accepts only the canonical same-origin request', () => {
    expect(isSameOriginMutation(new Request(`${SITE}/api/test`, {
      method: 'POST',
      headers: { Origin: SITE, 'Sec-Fetch-Site': 'same-origin' },
    }), SITE)).toBe(true);
    expect(isSameOriginMutation(new Request(`${SITE}/api/test`, {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site' },
    }), SITE)).toBe(false);
  });

  it('rejects a poisoned request host even with a forged matching Origin', () => {
    expect(isSameOriginMutation(new Request('https://evil.example/api/test', {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Sec-Fetch-Site': 'same-origin' },
    }), SITE)).toBe(false);
  });

  it('fails closed without provenance and rejects null/spoofed origins', () => {
    expect(isSameOriginMutation(new Request(`${SITE}/api/test`, {
      method: 'POST',
    }), SITE)).toBe(false);
    expect(isSameOriginMutation(new Request(`${SITE}/api/test`, {
      method: 'POST',
      headers: { Origin: 'null', 'Sec-Fetch-Site': 'same-origin' },
    }), SITE)).toBe(false);
    expect(isSameOriginMutation(new Request(`${SITE}/api/test`, {
      method: 'POST',
      headers: {
        Origin: 'https://tornei.ebartex.com.attacker.test',
        'Sec-Fetch-Site': 'same-origin',
      },
    }), SITE)).toBe(false);
  });

  it('allows an exact HTTPS Referer only as the missing-Origin fallback', () => {
    expect(isSameOriginMutation(new Request(`${SITE}/api/test`, {
      method: 'POST',
      headers: { Referer: `${SITE}/tornei/abc`, 'Sec-Fetch-Site': 'same-origin' },
    }), SITE)).toBe(true);
    expect(isSameOriginMutation(new Request(`${SITE}/api/test`, {
      method: 'POST',
      headers: { Referer: 'https://evil.example/', 'Sec-Fetch-Site': 'same-origin' },
    }), SITE)).toBe(false);
  });
});
