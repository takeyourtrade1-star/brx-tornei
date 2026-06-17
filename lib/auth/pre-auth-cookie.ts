import 'server-only';

import { cookies } from 'next/headers';
import { config } from '@/lib/config';

const PRE_AUTH_COOKIE = 'ebartex_pre_auth_token';
const PRE_AUTH_MAX_AGE = 600; // 10 minuti

function preAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: PRE_AUTH_MAX_AGE,
  };
}

export async function setPreAuthCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(PRE_AUTH_COOKIE, token, preAuthCookieOptions());
}

export async function getPreAuthCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(PRE_AUTH_COOKIE)?.value ?? null;
}

export async function clearPreAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(PRE_AUTH_COOKIE);
}
