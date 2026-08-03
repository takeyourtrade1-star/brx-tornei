import 'server-only';

import { readBoundedResponseJson } from '@/lib/security/bounded-response';

const MAX_UPSTASH_RESPONSE_BYTES = 256 * 1024;
const MIN_TOKEN_LENGTH = 32;
const MAX_TOKEN_LENGTH = 2_048;

export class UpstashConfigurationError extends Error {}

export interface UpstashRedisConfig {
  origin: string;
  token: string;
}

/**
 * Validate the credential destination before a bearer token can be attached.
 * The credential destination is pinned to one explicit non-secret hostname.
 */
export function parseUpstashRedisConfig(
  rawUrl: string | undefined,
  rawToken: string | undefined,
  environment = process.env.NODE_ENV,
  rawAllowedHostname = process.env.UPSTASH_REDIS_ALLOWED_HOSTNAME,
): UpstashRedisConfig | null {
  const urlValue = rawUrl?.trim() ?? '';
  const rawTokenValue = rawToken ?? '';
  const token = rawTokenValue.trim();
  if (!urlValue && !token) return null;
  if (!urlValue || !token) {
    throw new UpstashConfigurationError('Upstash URL and token must be configured together');
  }
  if (
    token !== rawTokenValue ||
    token.length < MIN_TOKEN_LENGTH ||
    token.length > MAX_TOKEN_LENGTH ||
    /[^\x21-\x7e]/.test(token)
  ) {
    throw new UpstashConfigurationError('Upstash token has an invalid format');
  }

  let parsed: URL;
  try {
    parsed = new URL(urlValue);
  } catch {
    throw new UpstashConfigurationError('Upstash URL is invalid');
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new UpstashConfigurationError('Upstash URL must be a bare HTTPS origin');
  }
  const allowedHostname = rawAllowedHostname?.trim() ?? '';
  if (
    !allowedHostname ||
    allowedHostname !== rawAllowedHostname ||
    allowedHostname !== allowedHostname.toLowerCase() ||
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(allowedHostname) ||
    !allowedHostname.endsWith('.upstash.io') ||
    parsed.hostname.toLowerCase() !== allowedHostname
  ) {
    throw new UpstashConfigurationError('Upstash host does not match the exact allowlist');
  }
  if (environment === 'production' && parsed.port && parsed.port !== '443') {
    throw new UpstashConfigurationError('Production Upstash URL must use the standard TLS port');
  }
  return Object.freeze({ origin: parsed.origin, token });
}

export function getUpstashRedisConfig(): UpstashRedisConfig | null {
  return parseUpstashRedisConfig(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
    process.env.NODE_ENV,
    process.env.UPSTASH_REDIS_ALLOWED_HOSTNAME,
  );
}

export function isUpstashRedisConfigured(): boolean {
  return getUpstashRedisConfig() !== null;
}

export async function executeUpstashPipeline(
  commands: (string | number)[][],
  timeoutMs = 5_000,
): Promise<unknown> {
  const config = getUpstashRedisConfig();
  if (!config) throw new UpstashConfigurationError('Upstash is not configured');
  const response = await fetch(`${config.origin}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'Accept-Encoding': 'identity',
    },
    body: JSON.stringify(commands),
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error('Upstash request failed');
  return readBoundedResponseJson(response, MAX_UPSTASH_RESPONSE_BYTES);
}
