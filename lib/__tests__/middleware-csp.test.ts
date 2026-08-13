import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';

vi.mock('server-only', () => ({}));

import {
  buildContentSecurityPolicy,
  middleware,
} from '@/middleware';
import { isCanonicalRequestHost } from '@/lib/security/canonical-origin';
import { BRIDGE_NONCE_COOKIE } from '@/lib/auth/bridge-nonce';

describe('middleware CSP', () => {
  it('usa nonce e WebAssembly ristretto senza unsafe-inline/eval per gli script', () => {
    const csp = buildContentSecurityPolicy('abc123');

    expect(csp).toContain(
      "script-src 'self' 'nonce-abc123' 'strict-dynamic' 'wasm-unsafe-eval'",
    );
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("style-src-elem 'self'");
    expect(csp).toContain("style-src-attr 'unsafe-inline'");
    expect(csp).not.toMatch(/style-src(?!-(?:elem|attr))[^;]*'unsafe-inline'/);
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain('connect-src https:');
    expect(csp).not.toContain('connect-src wss:');
    // L'origine di upload entra nella CSP solo quando la feature e la relativa
    // origin sono configurate esplicitamente; nessun bucket production implicito.
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain('match-gaps.s3.eu-south-1.amazonaws.com');
    expect(csp).not.toContain('*.amazonaws.com');
    expect(csp).not.toContain('*.cloudfront.net');
    expect(csp).not.toContain('*.scryfall.io');
  });

  it('mantiene l’image optimizer su hostname esterni esatti', () => {
    const nextConfig = readFileSync(
      new URL('../../next.config.mjs', import.meta.url),
      'utf8',
    );
    expect(nextConfig).not.toMatch(/hostname:\s*['"]\*\./);
    expect(nextConfig).toContain("hostname: 'di0y87a9s8da9.cloudfront.net'");
    expect(nextConfig).toContain("hostname: 'cards.scryfall.io'");
  });

  it('sovrascrive nonce client-controlled e ne usa uno nuovo per ogni risposta', () => {
    const first = middleware(
      new NextRequest('https://tornei.ebartex.com/login', {
        headers: { 'x-nonce': 'attacker-controlled' },
      }),
    );
    const second = middleware(new NextRequest('https://tornei.ebartex.com/login'));

    const firstCsp = first.headers.get('content-security-policy');
    const secondCsp = second.headers.get('content-security-policy');
    expect(firstCsp).toMatch(/'nonce-[a-f0-9]{32}'/);
    expect(firstCsp).not.toContain('attacker-controlled');
    expect(secondCsp).toMatch(/'nonce-[a-f0-9]{32}'/);
    expect(secondCsp).not.toBe(firstCsp);
  });

  it('applica la CSP anche ai redirect di autenticazione', () => {
    const response = middleware(
      new NextRequest('https://tornei.ebartex.com/tornei/privato'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('content-security-policy')).toMatch(
      /script-src 'self' 'nonce-[a-f0-9]{32}' 'strict-dynamic'/,
    );
    expect(response.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0',
    );
  });

  it('emette un nonce monouso solo per refresh navigation non cross-site', () => {
    const sameOrigin = middleware(
      new NextRequest('https://tornei.ebartex.com/tornei', {
        headers: {
          cookie: '__Host-ebartex_refresh_token=refresh-token',
          'sec-fetch-site': 'same-origin',
        },
      }),
    );
    expect(sameOrigin.headers.get('location')).toMatch(
      /\/auth\/bridge\?next=%2Ftornei&nonce=[a-f0-9]{32}/,
    );
    expect(sameOrigin.headers.get('set-cookie')).toContain(`${BRIDGE_NONCE_COOKIE}=`);

    const crossSite = middleware(
      new NextRequest('https://tornei.ebartex.com/tornei', {
        headers: {
          cookie: '__Host-ebartex_refresh_token=refresh-token',
          'sec-fetch-site': 'cross-site',
        },
      }),
    );
    expect(crossSite.headers.get('location')).toContain('/login');
    expect(crossSite.headers.get('location')).not.toContain('/auth/bridge');
    expect(crossSite.headers.get('set-cookie')).toBeNull();
  });

  it('rifiuta host poisoning rispetto all host canonico', () => {
    expect(
      isCanonicalRequestHost('tornei.ebartex.com', 'https://tornei.ebartex.com'),
    ).toBe(true);
    // L'header Host può includere la porta esplicita: va ignorata.
    expect(
      isCanonicalRequestHost('tornei.ebartex.com:443', 'https://tornei.ebartex.com'),
    ).toBe(true);
    expect(
      isCanonicalRequestHost('attacker.example', 'https://tornei.ebartex.com'),
    ).toBe(false);
    expect(isCanonicalRequestHost(null, 'https://tornei.ebartex.com')).toBe(false);
  });
});
