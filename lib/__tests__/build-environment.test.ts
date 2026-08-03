import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  deriveTournamentWebSocketOrigin,
  parseTrustedHttpsHostnames,
  validateProductionEnvironment,
} from '@/lib/build-environment.mjs';

const validProductionEnvironment = {
  NODE_ENV: 'production',
  TRUSTED_HTTPS_HOSTNAMES:
    'auth.example.com,sync.example.com,tournaments.example.com,app.example.com,www.example.com,redis-test.upstash.io,match.example.com',
  TRUSTED_UPSTREAM_HOSTS:
    'auth.example.com,sync.example.com,tournaments.example.com',
  AUTH_API_URL: 'https://auth.example.com',
  SYNC_API_URL: 'https://sync.example.com',
  TOURNAMENTS_API_URL: 'https://tournaments.example.com',
  NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN: 'wss://tournaments.example.com',
  NEXT_PUBLIC_SITE_URL: 'https://app.example.com',
  NEXT_PUBLIC_MAIN_SITE_URL: 'https://www.example.com',
  WEBCAM_RELAY_SECRET: 'a'.repeat(32),
  UPSTASH_REDIS_REST_URL: 'https://redis-test.upstash.io',
  UPSTASH_REDIS_ALLOWED_HOSTNAME: 'redis-test.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 't'.repeat(48),
  BRX_MATCH_API_URL: 'https://match.example.com',
  BRX_MATCH_ALLOWED_ORIGIN: 'https://match.example.com',
  BRX_MATCH_INTERNAL_TOKEN: 'm'.repeat(48),
  BRX_MATCH_INTERNAL_CALLER: 'brx-tornei',
  BRX_MATCH_EDGE_MODEL_SHA256: 'a'.repeat(64),
};

describe('validazione ambiente di build', () => {
  it('non richiede Google Fonts o file font locali mancanti durante la build', () => {
    const layout = readFileSync(new URL('../../app/layout.tsx', import.meta.url), 'utf8');
    const globals = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8');
    expect(layout).not.toContain('next/font/google');
    expect(globals).not.toMatch(/url\(['"]?\/fonts\//);
  });

  it('normalizza origin HTTPS e mantiene WSS sullo stesso host', () => {
    const result = validateProductionEnvironment({
      ...validProductionEnvironment,
      NEXT_PUBLIC_SITE_URL: 'https://app.example.com/',
    });

    expect(result?.origins.NEXT_PUBLIC_SITE_URL).toBe('https://app.example.com');
    expect(result?.tournamentWebSocketOrigin).toBe(
      'wss://tournaments.example.com',
    );
  });

  it.each([
    ['http://auth.example.com', 'must use https://'],
    ['https://user@auth.example.com', 'must not contain credentials'],
    ['https://auth.example.com/v1', 'must not contain a path'],
    ['https://auth.example.com?next=evil', 'must not contain a path'],
    ['https://auth.example.com#fragment', 'must not contain a path'],
    ['https://auth.example.com:8443', 'must use the default TLS port'],
    ['https://auth.example.com.evil.test', 'hostname is not'],
  ])('rifiuta origin ambiguo o non autorizzato: %s', (value, message) => {
    expect(() =>
      validateProductionEnvironment({
        ...validProductionEnvironment,
        AUTH_API_URL: value,
      }),
    ).toThrow(message);
  });

  it('rifiuta il classico bypass userinfo di un controllo startsWith', () => {
    expect(() =>
      validateProductionEnvironment({
        ...validProductionEnvironment,
        AUTH_API_URL:
          'https://auth.example.com:password@attacker.example.com',
      }),
    ).toThrow('must not contain credentials');
  });

  it('rifiuta un endpoint Redis non Upstash anche se inserito nella allowlist generale', () => {
    expect(() =>
      validateProductionEnvironment({
        ...validProductionEnvironment,
        TRUSTED_HTTPS_HOSTNAMES:
          `${validProductionEnvironment.TRUSTED_HTTPS_HOSTNAMES},redis.attacker.test`,
        UPSTASH_REDIS_REST_URL: 'https://redis.attacker.test',
      }),
    ).toThrow('exactly match');
  });

  it('rifiuta tenant Upstash e origin Match diversi dalle allowlist esatte', () => {
    expect(() =>
      validateProductionEnvironment({
        ...validProductionEnvironment,
        TRUSTED_HTTPS_HOSTNAMES:
          `${validProductionEnvironment.TRUSTED_HTTPS_HOSTNAMES},other-redis.upstash.io`,
        UPSTASH_REDIS_REST_URL: 'https://other-redis.upstash.io',
      }),
    ).toThrow('exactly match');
    expect(() =>
      validateProductionEnvironment({
        ...validProductionEnvironment,
        TRUSTED_HTTPS_HOSTNAMES:
          `${validProductionEnvironment.TRUSTED_HTTPS_HOSTNAMES},evil.example.com`,
        BRX_MATCH_API_URL: 'https://evil.example.com',
      }),
    ).toThrow('exactly match');
  });

  it('rifiuta token Upstash corti o con caratteri di controllo', () => {
    expect(() =>
      validateProductionEnvironment({
        ...validProductionEnvironment,
        UPSTASH_REDIS_REST_TOKEN: 'short',
      }),
    ).toThrow('invalid format');
    expect(() =>
      validateProductionEnvironment({
        ...validProductionEnvironment,
        UPSTASH_REDIS_REST_TOKEN: `${'t'.repeat(48)}\n`,
      }),
    ).toThrow('invalid format');
  });

  it('rifiuta un origin WSS non coerente con il Tournament Service HTTPS', () => {
    expect(() =>
      validateProductionEnvironment({
        ...validProductionEnvironment,
        TRUSTED_HTTPS_HOSTNAMES: `${validProductionEnvironment.TRUSTED_HTTPS_HOSTNAMES},ws.example.com`,
        NEXT_PUBLIC_TOURNAMENTS_WS_ORIGIN: 'wss://ws.example.com',
      }),
    ).toThrow('must be the wss:// equivalent');
  });

  it('vieta origin REST e chiavi service nel namespace NEXT_PUBLIC', () => {
    for (const name of [
      'NEXT_PUBLIC_AUTH_API_URL',
      'NEXT_PUBLIC_SYNC_API_URL',
      'NEXT_PUBLIC_TOURNAMENTS_API_URL',
      'NEXT_PUBLIC_MEILISEARCH_URL',
      'NEXT_PUBLIC_MEILISEARCH_API_KEY',
    ]) {
      expect(() =>
        validateProductionEnvironment({
          ...validProductionEnvironment,
          [name]: 'https://leak.example.com',
        }),
      ).toThrow('must not be NEXT_PUBLIC');
    }
  });

  it.each([
    'example.com,*',
    'example.com,https://api.example.com',
    'example.com,api.example.com:443',
    'example.com,localhost',
    'example.com,127.0.0.1',
    'example.com,API.EXAMPLE.COM',
  ])('rifiuta una allowlist hostname non esatta: %s', (value) => {
    expect(() => parseTrustedHttpsHostnames(value)).toThrow();
  });

  it('deriva esclusivamente wss:// da un origin HTTPS canonico', () => {
    expect(deriveTournamentWebSocketOrigin('https://api.example.com')).toBe(
      'wss://api.example.com',
    );
    expect(() =>
      deriveTournamentWebSocketOrigin('http://api.example.com'),
    ).toThrow('not canonical');
  });

  it('salta i vincoli di produzione nel development locale', () => {
    expect(validateProductionEnvironment({ NODE_ENV: 'development' })).toBeNull();
  });

  it('rifiuta un digest modello mancante, maiuscolo o non SHA-256', () => {
    for (const value of [undefined, 'A'.repeat(64), 'a'.repeat(63)]) {
      expect(() =>
        validateProductionEnvironment({
          ...validProductionEnvironment,
          BRX_MATCH_EDGE_MODEL_SHA256: value,
        }),
      ).toThrow(/BRX_MATCH_EDGE_MODEL_SHA256|Missing production environment/);
    }
  });
});
