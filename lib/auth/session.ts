import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import type { Session, SessionUser, TokenResponse } from '@/types/auth';

/**
 * Sessione cookie-first (server-only).
 * I token vivono in cookie HttpOnly; RSC, Server Actions e middleware
 * sono gli unici a leggerli. Niente localStorage (vedi ARCHITECTURE.md §2.3).
 */

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(config.auth.accessCookie)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(config.auth.refreshCookie)?.value ?? null;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
    ...(config.auth.cookieDomain ? { domain: config.auth.cookieDomain } : {}),
  };
}

/** Imposta i cookie di sessione (chiamabile da Server Action o Route Handler). */
export async function setSessionCookies(tokens: TokenResponse): Promise<void> {
  const store = await cookies();
  const accessMaxAge =
    tokens.expires_in && tokens.expires_in > 0
      ? Math.floor(tokens.expires_in)
      : config.auth.accessMaxAge;

  store.set(config.auth.accessCookie, tokens.access_token, cookieOptions(accessMaxAge));
  if (tokens.refresh_token) {
    store.set(
      config.auth.refreshCookie,
      tokens.refresh_token,
      cookieOptions(config.auth.refreshMaxAge)
    );
  }
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.set(config.auth.accessCookie, '', cookieOptions(0));
  store.set(config.auth.refreshCookie, '', cookieOptions(0));
}

function normalizeUser(payload: unknown): SessionUser | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = (payload as Record<string, unknown>).user ?? (payload as Record<string, unknown>).data ?? payload;
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  if (u.id === undefined && u.email === undefined) return null;
  return {
    id: String(u.id ?? ''),
    email: String(u.email ?? ''),
    name: (u.name as string) ?? (u.username as string) ?? null,
  };
}

/**
 * Sessione corrente: valida l'access token con GET /api/auth/me.
 * `cache()` deduplica la chiamata all'interno della stessa request RSC.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const accessToken = await getAccessToken();
  if (!accessToken || !config.api.baseURL) return null;

  try {
    const res = await fetch(`${config.api.baseURL}/api/auth/me`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(config.api.timeout),
    });
    if (!res.ok) return null;

    const user = normalizeUser(await res.json().catch(() => null));
    return user ? { user, accessToken } : null;
  } catch {
    return null;
  }
});
