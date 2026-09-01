import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ARCADE_ACCESS_COOKIE = '__Host-ebartex_arcade_access';
export const ARCADE_ACCESS_MAX_AGE_SECONDS = 8 * 60 * 60;

const TOKEN_VERSION = 1;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 256;
const TOKEN_PART_PATTERN = /^[A-Za-z0-9_-]+$/;

interface ArcadeAccessPayload {
  v: number;
  sub: string;
  exp: number;
}

function configuredPassword(): string | null {
  const password = process.env.ARCADE_ROOM_ACCESS_PASSWORD;
  if (
    typeof password !== 'string' ||
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return null;
  }
  return password;
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function signingKey(password: string): Buffer {
  return createHash('sha256')
    .update('ebartex:arcade-access:v1\0', 'utf8')
    .update(password, 'utf8')
    .digest();
}

function signature(body: string, password: string): Buffer {
  return createHmac('sha256', signingKey(password)).update(body, 'ascii').digest();
}

function encodePayload(payload: ArcadeAccessPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodePayload(body: string): ArcadeAccessPayload | null {
  try {
    const value = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as unknown;
    if (!value || typeof value !== 'object') return null;
    const payload = value as Partial<ArcadeAccessPayload>;
    if (
      payload.v !== TOKEN_VERSION ||
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      typeof payload.exp !== 'number' ||
      !Number.isSafeInteger(payload.exp)
    ) {
      return null;
    }
    return payload as ArcadeAccessPayload;
  } catch {
    return null;
  }
}

function createAccessToken(userId: string, nowSeconds: number): string | null {
  const password = configuredPassword();
  if (!password || !userId) return null;
  const body = encodePayload({
    v: TOKEN_VERSION,
    sub: userId,
    exp: nowSeconds + ARCADE_ACCESS_MAX_AGE_SECONDS,
  });
  return `${body}.${signature(body, password).toString('base64url')}`;
}

export function isArcadeAccessConfigured(): boolean {
  return configuredPassword() !== null;
}

export function verifyArcadePassword(candidate: string): boolean {
  const password = configuredPassword();
  if (
    !password ||
    candidate.length < 1 ||
    candidate.length > PASSWORD_MAX_LENGTH
  ) {
    return false;
  }
  return timingSafeEqual(digest(candidate), digest(password));
}

export function verifyArcadeAccessToken(
  token: string,
  userId: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const password = configuredPassword();
  if (!password || !userId || token.length > 2_048) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [body, suppliedSignature] = parts;
  if (
    !body ||
    !suppliedSignature ||
    !TOKEN_PART_PATTERN.test(body) ||
    !TOKEN_PART_PATTERN.test(suppliedSignature)
  ) {
    return false;
  }

  const supplied = Buffer.from(suppliedSignature, 'base64url');
  const expected = signature(body, password);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return false;
  }

  const payload = decodePayload(body);
  return Boolean(
    payload &&
    payload.sub === userId &&
    payload.exp > nowSeconds &&
    payload.exp <= nowSeconds + ARCADE_ACCESS_MAX_AGE_SECONDS,
  );
}

export async function hasArcadeAccess(userId: string): Promise<boolean> {
  const token = (await cookies()).get(ARCADE_ACCESS_COOKIE)?.value;
  return typeof token === 'string' && verifyArcadeAccessToken(token, userId);
}

export async function grantArcadeAccess(userId: string): Promise<boolean> {
  const token = createAccessToken(userId, Math.floor(Date.now() / 1000));
  if (!token) return false;
  (await cookies()).set(ARCADE_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: ARCADE_ACCESS_MAX_AGE_SECONDS,
  });
  return true;
}
