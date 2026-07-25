import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

export type WebcamRelayRole = 'host' | 'guest';

const CAPABILITY_TTL_SECONDS = 10 * 60;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;

interface CapabilityPayload {
  sid: string;
  role: WebcamRelayRole;
  exp: number;
}

function secret(): string | null {
  const configured = process.env.WEBCAM_RELAY_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  return process.env.NODE_ENV === 'development'
    ? 'development-only-webcam-relay-secret'
    : null;
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
): string | null {
  const key = secret();
  if (!key || !isValidWebcamSessionId(sessionId)) return null;
  const payload: CapabilityPayload = {
    sid: sessionId,
    role,
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
  const key = secret();
  if (!key || !token || !isValidWebcamSessionId(sessionId)) return false;
  const [encoded, supplied, extra] = token.split('.');
  if (!encoded || !supplied || extra) return false;
  const expected = signature(encoded, key);
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return false;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as Partial<CapabilityPayload>;
    return (
      payload.sid === sessionId &&
      payload.role === role &&
      typeof payload.exp === 'number' &&
      payload.exp >= nowSeconds &&
      payload.exp <= nowSeconds + CAPABILITY_TTL_SECONDS
    );
  } catch {
    return false;
  }
}
