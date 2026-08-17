import 'server-only';

import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import { isValidAuthCookieToken } from '@/lib/auth/auth-token';

export const PRE_AUTH_MAX_AGE = 300; // allineato al PRE_AUTH Auth (5 minuti)

function preAuthCookieOptions(maxAge = PRE_AUTH_MAX_AGE) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function setPreAuthCookie(token: string): Promise<void> {
  if (!isValidAuthCookieToken(token)) {
    throw new TypeError('Invalid pre-auth token');
  }
  const store = await cookies();
  store.set(config.auth.preAuthCookie, token, preAuthCookieOptions());
}

export async function getPreAuthCookie(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(config.auth.preAuthCookie)?.value;
  return isValidAuthCookieToken(token) ? token : null;
}

export async function clearPreAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set(config.auth.preAuthCookie, '', preAuthCookieOptions(0));
}
