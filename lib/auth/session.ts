import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import type { Session, SessionUser, TokenResponse } from '@/types/auth';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';
import {
  isValidAuthCookieToken,
  isValidAuthTokenPair,
  resolveAccessCookieMaxAge,
} from '@/lib/auth/auth-token';
import {
  getCachedSession,
  isTransientAuthStatus,
  setCachedSession,
} from '@/lib/auth/session-cache';

/**
 * Sessione cookie-first (server-only).
 * I token vivono in cookie HttpOnly; RSC, Server Actions e middleware
 * sono gli unici a leggerli. Niente localStorage (vedi ARCHITECTURE.md §2.3).
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

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

/** Imposta i cookie di sessione (chiamabile da Server Action o Route Handler). */
export async function setSessionCookies(tokens: TokenResponse): Promise<void> {
  if (!isValidAuthTokenPair(tokens)) {
    throw new TypeError('Invalid auth token pair');
  }
  const store = await cookies();
  const accessMaxAge = resolveAccessCookieMaxAge(
    tokens.access_token,
    tokens.expires_in,
    config.auth.accessMaxAge,
  );

  store.set(config.auth.accessCookie, tokens.access_token, cookieOptions(accessMaxAge));
  store.set(
    config.auth.refreshCookie,
    tokens.refresh_token,
    cookieOptions(config.auth.refreshMaxAge)
  );
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.set(config.auth.accessCookie, '', cookieOptions(0));
  store.set(config.auth.refreshCookie, '', cookieOptions(0));
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function normalizeSessionUser(payload: unknown): SessionUser | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = (payload as Record<string, unknown>).user ?? (payload as Record<string, unknown>).data ?? payload;
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  if (u.id === undefined && u.email === undefined) return null;
  const username = optionalString(u.username);
  return {
    id: String(u.id ?? ''),
    email: String(u.email ?? ''),
    username,
    name: optionalString(u.name) ?? username,
  };
}

/**
 * Sessione corrente: valida l'access token con GET /api/auth/me.
 * `cache()` deduplica la chiamata all'interno della stessa request RSC; una
 * micro-cache keyed per token evita inoltre che il polling dei match trasformi
 * un 429/5xx del rate limiter in un falso logout per tutte le tab aperte.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const accessToken = await getAccessToken();
  if (!accessToken || !config.api.baseURL) return null;

  const cached = getCachedSession(accessToken);
  if (cached) return cached.value;

  const check = async (): Promise<{ session: Session | null; transient: boolean }> => {
    try {
      const res = await fetch(`${config.api.baseURL}/api/auth/me`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Accept-Encoding': 'identity',
        },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(config.api.timeout),
      });
      if (isTransientAuthStatus(res.status)) return { session: null, transient: true };
      if (!res.ok) return { session: null, transient: false };

      const user = normalizeSessionUser(
        await readBoundedResponseJson(res, 256 * 1024).catch(() => null),
      );
      return { session: user ? { user } : null, transient: false };
    } catch {
      return { session: null, transient: true };
    }
  };

  const first = await check();
  let outcome = first;
  if (first.transient) {
    // Un 429/5xx non è un logout: un solo retry assorbe la raffica iniziale del
    // polling senza aggiungere carico significativo al bucket condiviso.
    outcome = await check();
  }
  setCachedSession(accessToken, outcome.session);
  return outcome.session;
});
