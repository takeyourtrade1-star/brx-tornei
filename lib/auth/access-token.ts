import 'server-only';

import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import { isValidAuthCookieToken } from '@/lib/auth/auth-token';

/**
 * Lettura dei token di sessione dai cookie HttpOnly.
 *
 * Vive in un modulo foglia, separato da `lib/auth/session.ts`: quest'ultimo
 * usa `cache()` di React e trascina l'intero runtime RSC in ogni consumer,
 * mentre il data layer ha bisogno solo del token.
 */

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(config.auth.accessCookie)?.value;
  return isValidAuthCookieToken(token) ? token : null;
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(config.auth.refreshCookie)?.value;
  return isValidAuthCookieToken(token) ? token : null;
}
