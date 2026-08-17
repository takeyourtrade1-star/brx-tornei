import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { config } from '@/lib/config';
import { sanitizeRedirect } from '@/lib/auth/redirect';

export const SSO_STATE_COOKIE = '__Host-ebartex_sso_state';
export const SSO_VERIFIER_COOKIE = '__Host-ebartex_sso_verifier';
export const SSO_NEXT_COOKIE = '__Host-ebartex_sso_next';
export const SSO_TRANSIENT_MAX_AGE_SECONDS = 120;
export const SSO_TARGET_CLIENT_ID = 'tournaments';

const OPAQUE_VALUE_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;
const STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CLIENT_SECRET_PATTERN = /^[A-Za-z0-9._~-]{32,256}$/;

function isLoopback(hostname: string): boolean {
  if (hostname === 'localhost') return true;
  const version = isIP(hostname);
  return version === 4
    ? hostname.startsWith('127.')
    : version === 6 && (hostname === '::1' || hostname === '[::1]');
}

function isUsableBrowserOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    if (
      url.origin !== value ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return false;
    }
    if (process.env.NODE_ENV === 'production') {
      return url.protocol === 'https:' && !url.port;
    }
    return url.protocol === 'https:' || (
      url.protocol === 'http:' && isLoopback(url.hostname)
    );
  } catch {
    return false;
  }
}

export interface SsoHandoffConfig {
  authorizeUrl: string;
  callbackUrl: string;
  clientSecret: string;
  exchangeUrl: string;
  timeoutMs: number;
}

export interface SsoTransaction {
  state: string;
  verifier: string;
  challenge: string;
  next: string;
}

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

export function createSsoTransaction(rawNext: string | null): SsoTransaction {
  const verifier = base64Url(randomBytes(32));
  return {
    state: base64Url(randomBytes(32)),
    verifier,
    challenge: createHash('sha256').update(verifier, 'ascii').digest('base64url'),
    next: sanitizeRedirect(rawNext),
  };
}

export function isValidSsoState(value: string | null | undefined): value is string {
  return typeof value === 'string' && STATE_PATTERN.test(value);
}

export function isValidSsoOpaqueValue(
  value: string | null | undefined,
): value is string {
  return typeof value === 'string' && OPAQUE_VALUE_PATTERN.test(value);
}

export function ssoStatesMatch(
  presented: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!isValidSsoState(presented) || !isValidSsoState(expected)) return false;
  return timingSafeEqual(Buffer.from(presented), Buffer.from(expected));
}

export function getSsoHandoffConfig(): SsoHandoffConfig | null {
  if (process.env.SSO_HANDOFF_ENABLED !== 'true') return null;
  const clientSecret = process.env.SSO_TOURNAMENTS_CLIENT_SECRET?.trim() ?? '';
  if (!CLIENT_SECRET_PATTERN.test(clientSecret)) return null;
  if (
    !config.api.baseURL ||
    !isUsableBrowserOrigin(config.app.siteUrl) ||
    !isUsableBrowserOrigin(config.app.mainSiteUrl)
  ) {
    return null;
  }

  try {
    return {
      authorizeUrl: new URL('/api/auth/sso/authorize', config.app.mainSiteUrl).href,
      callbackUrl: new URL(
        '/auth/bridge/sso/callback',
        config.app.siteUrl,
      ).href,
      clientSecret,
      exchangeUrl: new URL('/api/auth/sso/exchange', config.api.baseURL).href,
      timeoutMs: Math.min(config.api.timeout, 10_000),
    };
  } catch {
    return null;
  }
}
