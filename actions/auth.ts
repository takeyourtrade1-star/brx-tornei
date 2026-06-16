'use server';

import { redirect } from 'next/navigation';
import { config } from '@/lib/config';
import {
  clearSessionCookies,
  getRefreshToken,
  setSessionCookies,
} from '@/lib/auth/session';
import { buildLoginPayload, loginSchema } from '@/lib/validations/auth';
import type { AuthActionState, TokenResponse } from '@/types/auth';

/** Estrae il body utile: il backend a volte annida la risposta in { data: ... }. */
function unwrap(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const data = (payload as Record<string, unknown>).data;
  return (data && typeof data === 'object' ? data : payload) as Record<string, unknown>;
}

/**
 * Login speculare a Ebartex (stesso backend FastAPI, stesso honeypot),
 * ma cookie-first: i token finiscono in cookie HttpOnly, mai nel client.
 */
export async function loginAction(formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get('identifier'),
    password: formData.get('password'),
    website_url: formData.get('website_url') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi' };
  }
  if (!config.api.baseURL) {
    return { error: 'Auth API non configurata (NEXT_PUBLIC_AUTH_API_URL)' };
  }

  let response: Record<string, unknown>;
  try {
    const res = await fetch(`${config.api.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(buildLoginPayload(parsed.data)),
      cache: 'no-store',
      signal: AbortSignal.timeout(config.api.timeout),
    });
    const body = unwrap(await res.json().catch(() => ({})));
    if (!res.ok) {
      const detail =
        (typeof body.detail === 'string' && body.detail) ||
        (typeof body.message === 'string' && body.message) ||
        'Credenziali non valide';
      return { error: detail };
    }
    response = body;
  } catch {
    return { error: 'Impossibile contattare il servizio di autenticazione' };
  }

  // MFA richiesta: l'MVP rimanda al sito principale (step da implementare in M2).
  if (response.mfa_required === true) {
    return {
      mfaRequired: true,
      error: 'Account con MFA attiva: completa il login dal sito principale (supporto in arrivo).',
    };
  }

  if (
    typeof response.access_token !== 'string' ||
    typeof response.refresh_token !== 'string'
  ) {
    return { error: 'Risposta login non valida' };
  }

  await setSessionCookies(response as unknown as TokenResponse);
  redirect('/hub');
}

/** Logout: invalida la sessione sul backend e cancella i cookie parent-domain. */
export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken && config.api.baseURL) {
    try {
      await fetch(`${config.api.baseURL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: 'no-store',
        signal: AbortSignal.timeout(config.api.timeout),
      });
    } catch {
      // Anche se il logout remoto fallisce, puliamo la sessione locale.
    }
  }
  await clearSessionCookies();
  redirect('/login');
}
