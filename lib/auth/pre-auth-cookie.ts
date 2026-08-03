import 'server-only';

import { cookies } from 'next/headers';
import { config } from '@/lib/config';

const PRE_AUTH_MAX_AGE = 600; // 10 minuti

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
  const store = await cookies();
  store.set(config.auth.preAuthCookie, token, preAuthCookieOptions());
}

export async function getPreAuthCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(config.auth.preAuthCookie)?.value ?? null;
}

export async function clearPreAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set(config.auth.preAuthCookie, '', preAuthCookieOptions(0));
}
