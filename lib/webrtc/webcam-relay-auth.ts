import 'server-only';

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  executeUpstashPipeline,
  isUpstashRedisConfigured,
} from '@/lib/security/upstash-rest';

export type WebcamRelayRole = 'host' | 'guest';

const CAPABILITY_TTL_SECONDS = 10 * 60;
export const WEBCAM_RELAY_COOKIE_MAX_AGE_SECONDS = CAPABILITY_TTL_SECONDS;
export const WEBCAM_RELAY_COOKIE_PATH = '/api/tornei/webcam';
const CLAIM_TTL_SECONDS = 60;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;
const CLAIM_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const RELAY_ID_PATTERN = /^[A-Za-z0-9_-]{24,64}$/;
const CLAIM_PREFIX = 'webcam:claim:';

interface CapabilityPayload {
  sid: string;
  role: WebcamRelayRole;
  rid: string;
  exp: number;
}

export interface VerifiedWebcamRelayCapability {
  relayId: string;
  role: WebcamRelayRole;
}

interface ClaimRecord {
  sid: string;
  capability: string;
  exp: number;
}

const memoryClaims: Map<string, ClaimRecord> =
  (globalThis as unknown as { __webcamClaims?: Map<string, ClaimRecord> }).__webcamClaims ??
  new Map<string, ClaimRecord>();
(globalThis as unknown as { __webcamClaims?: Map<string, ClaimRecord> }).__webcamClaims = memoryClaims;

function secret(): string | null {
  const configured = process.env.WEBCAM_RELAY_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  return process.env.NODE_ENV === 'development'
    ? 'development-only-webcam-relay-secret'
    : null;
}

export function webcamRelayCookieName(): string {
  return process.env.NODE_ENV === 'development'
    ? 'ebartex_webcam_relay'
    : '__Secure-ebartex_webcam_relay';
}

function signature(encodedPayload: string, key: string): string {
  return createHmac('sha256', key).update(encodedPayload).digest('base64url');
}

export function isValidWebcamSessionId(sessionId: string): boolean {
  return SESSION_ID_PATTERN.test(sessionId);
}

export function issueWebcamRelayCapability(
  sessionId: string,
  role: WebcamRelayRole,
  nowSeconds = Math.floor(Date.now() / 1000),
  relayId = randomBytes(24).toString('base64url'),
): string | null {
  const key = secret();
  if (
    !key ||
    !isValidWebcamSessionId(sessionId) ||
    !RELAY_ID_PATTERN.test(relayId)
  ) return null;
  const payload: CapabilityPayload = {
    sid: sessionId,
    role,
    rid: relayId,
    exp: nowSeconds + CAPABILITY_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${signature(encoded, key)}`;
}

export function verifyWebcamRelayCapability(
  token: string | null,
  sessionId: string,
  role: WebcamRelayRole,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  return decodeWebcamRelayCapability(
    token,
    sessionId,
    role,
    nowSeconds,
  ) !== null;
}

export function decodeWebcamRelayCapability(
  token: string | null,
  sessionId: string,
  role: WebcamRelayRole,
  nowSeconds = Math.floor(Date.now() / 1000),
): VerifiedWebcamRelayCapability | null {
  const key = secret();
  if (!key || !token || !isValidWebcamSessionId(sessionId)) return null;
  const [encoded, supplied, extra] = token.split('.');
  if (!encoded || !supplied || extra) return null;
  const expected = signature(encoded, key);
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as Partial<CapabilityPayload>;
    if (
      payload.sid === sessionId &&
      payload.role === role &&
      typeof payload.rid === 'string' &&
      RELAY_ID_PATTERN.test(payload.rid) &&
      typeof payload.exp === 'number' &&
      payload.exp >= nowSeconds &&
      payload.exp <= nowSeconds + CAPABILITY_TTL_SECONDS
    ) {
      return { relayId: payload.rid, role };
    }
    return null;
  } catch {
    return null;
  }
}

function claimKey(claim: string): string {
  return `${CLAIM_PREFIX}${createHash('sha256').update(claim).digest('hex')}`;
}

async function upstash(command: (string | number)[]): Promise<unknown> {
  const payload = await executeUpstashPipeline([command]);
  if (!Array.isArray(payload)) throw new Error('claim store returned an invalid response');
  return (payload[0] as { result?: unknown } | undefined)?.result;
}

function requireClaimStore(): void {
  if (process.env.NODE_ENV === 'production' && !isUpstashRedisConfigured()) {
    throw new Error('distributed claim store required');
  }
}

/** Mint a PC capability plus a one-use phone claim. */
export async function issueWebcamRelayGrant(
  sessionId: string,
): Promise<{ hostToken: string; guestClaim: string } | null> {
  requireClaimStore();
  const relayId = randomBytes(24).toString('base64url');
  const hostToken = issueWebcamRelayCapability(sessionId, 'host', undefined, relayId);
  const guestToken = issueWebcamRelayCapability(sessionId, 'guest', undefined, relayId);
  if (!hostToken || !guestToken) return null;
  const claim = randomBytes(32).toString('base64url');
  const record: ClaimRecord = {
    sid: sessionId,
    capability: guestToken,
    exp: Math.floor(Date.now() / 1000) + CLAIM_TTL_SECONDS,
  };
  if (isUpstashRedisConfigured()) {
    const created = await upstash([
      'SET', claimKey(claim), JSON.stringify(record), 'EX', CLAIM_TTL_SECONDS, 'NX',
    ]);
    if (created !== 'OK') return null;
  } else {
    memoryClaims.set(claimKey(claim), record);
  }
  return { hostToken, guestClaim: claim };
}

/** Atomically exchange the QR fragment claim for the guest capability. */
export async function consumeWebcamGuestClaim(
  sessionId: string,
  claim: string,
): Promise<string | null> {
  requireClaimStore();
  if (!isValidWebcamSessionId(sessionId) || !CLAIM_PATTERN.test(claim)) return null;
  let raw: unknown;
  if (isUpstashRedisConfigured()) {
    raw = await upstash(['GETDEL', claimKey(claim)]);
  } else {
    const key = claimKey(claim);
    raw = memoryClaims.get(key) ?? null;
    memoryClaims.delete(key);
  }
  try {
    const record = (typeof raw === 'string' ? JSON.parse(raw) : raw) as ClaimRecord | null;
    if (!record || record.sid !== sessionId || record.exp < Math.floor(Date.now() / 1000)) return null;
    return verifyWebcamRelayCapability(record.capability, sessionId, 'guest')
      ? record.capability : null;
  } catch {
    return null;
  }
}
