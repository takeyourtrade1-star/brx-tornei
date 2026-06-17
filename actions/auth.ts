'use server';

import { redirect } from 'next/navigation';
import { config } from '@/lib/config';
import {
  clearSessionCookies,
  getRefreshToken,
  setSessionCookies,
} from '@/lib/auth/session';
import {
  clearPreAuthCookie,
  getPreAuthCookie,
  setPreAuthCookie,
} from '@/lib/auth/pre-auth-cookie';
import { sanitizeRedirect } from '@/lib/auth/redirect';
import {
  buildLoginPayload,
  loginCodeRequestSchema,
  loginCodeVerifySchema,
  loginSchema,
  verifyMfaFormSchema,
} from '@/lib/validations/auth';
import type { AuthActionState, TokenResponse } from '@/types/auth';

/** Estrae il body utile: il backend a volte annida la risposta in { data: ... }. */
function unwrap(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const data = (payload as Record<string, unknown>).data;
  return (data && typeof data === 'object' ? data : payload) as Record<string, unknown>;
}

function extractError(body: Record<string, unknown>, fallback: string): string {
  return (
    (typeof body.detail === 'string' && body.detail) ||
    (typeof body.message === 'string' && body.message) ||
    fallback
  );
}

async function authFetch(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  if (!config.api.baseURL) {
    return { ok: false, body: { message: 'Auth API non configurata (NEXT_PUBLIC_AUTH_API_URL)' } };
  }

  try {
    const res = await fetch(`${config.api.baseURL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(config.api.timeout),
    });
    const parsed = unwrap(await res.json().catch(() => ({})));
    return { ok: res.ok, body: parsed };
  } catch {
    return { ok: false, body: { message: 'Impossibile contattare il servizio di autenticazione' } };
  }
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
    redirect: formData.get('redirect') ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi' };
  }

  const destination = sanitizeRedirect(parsed.data.redirect ?? null);
  const { ok, body: response } = await authFetch('/api/auth/login', buildLoginPayload(parsed.data));

  if (!ok) {
    return { error: extractError(response, 'Credenziali non valide') };
  }

  if (response.mfa_required === true) {
    const preAuth =
      typeof response.pre_auth_token === 'string' ? response.pre_auth_token : null;
    if (!preAuth) {
      return { error: 'Risposta MFA non valida' };
    }
    await setPreAuthCookie(preAuth);
    redirect(`/login/verify-mfa?redirect=${encodeURIComponent(destination)}`);
  }

  if (
    typeof response.access_token !== 'string' ||
    typeof response.refresh_token !== 'string'
  ) {
    return { error: 'Risposta login non valida' };
  }

  await setSessionCookies(response as unknown as TokenResponse);
  redirect(destination);
}

/** Verifica MFA — completa il login dopo pre_auth_token. */
export async function verifyMfaAction(formData: FormData): Promise<AuthActionState> {
  const parsed = verifyMfaFormSchema.safeParse({
    mfa_code: formData.get('mfa_code'),
    remember_device: formData.get('remember_device') ?? undefined,
    redirect: formData.get('redirect') ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Codice non valido' };
  }

  const preAuthToken = await getPreAuthCookie();
  if (!preAuthToken) {
    return { error: 'Sessione MFA scaduta. Accedi di nuovo.' };
  }

  const destination = sanitizeRedirect(parsed.data.redirect ?? null);
  const { ok, body: response } = await authFetch('/api/auth/verify-mfa', {
    pre_auth_token: preAuthToken,
    mfa_code: parsed.data.mfa_code,
    remember_device: parsed.data.remember_device ?? false,
  });

  if (!ok) {
    return { error: extractError(response, 'Codice MFA non valido') };
  }

  if (
    typeof response.access_token !== 'string' ||
    typeof response.refresh_token !== 'string'
  ) {
    return { error: 'Risposta verifica MFA non valida' };
  }

  await setSessionCookies(response as unknown as TokenResponse);
  await clearPreAuthCookie();
  redirect(destination);
}

/** Richiesta codice monouso via email. */
export async function requestLoginCodeAction(formData: FormData): Promise<AuthActionState> {
  const parsed = loginCodeRequestSchema.safeParse({
    email: formData.get('email'),
    redirect: formData.get('redirect') ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Email non valida' };
  }

  const { ok, body } = await authFetch('/api/auth/login/code/request', {
    email: parsed.data.email,
  });

  if (!ok) {
    return { error: extractError(body, 'Impossibile inviare il codice') };
  }

  return { success: true };
}

/** Verifica codice monouso e imposta sessione. */
export async function verifyLoginCodeAction(formData: FormData): Promise<AuthActionState> {
  const parsed = loginCodeVerifySchema.safeParse({
    email: formData.get('email'),
    code: formData.get('code'),
    redirect: formData.get('redirect') ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Codice non valido' };
  }

  const destination = sanitizeRedirect(parsed.data.redirect ?? null);
  const { ok, body: response } = await authFetch('/api/auth/login/code/verify', {
    email: parsed.data.email,
    code: parsed.data.code,
  });

  if (!ok) {
    return { error: extractError(response, 'Codice non valido o scaduto') };
  }

  if (response.mfa_required === true) {
    const preAuth =
      typeof response.pre_auth_token === 'string' ? response.pre_auth_token : null;
    if (!preAuth) {
      return { error: 'Risposta MFA non valida' };
    }
    await setPreAuthCookie(preAuth);
    redirect(`/login/verify-mfa?redirect=${encodeURIComponent(destination)}`);
  }

  if (
    typeof response.access_token !== 'string' ||
    typeof response.refresh_token !== 'string'
  ) {
    return { error: 'Risposta login codice non valida' };
  }

  await setSessionCookies(response as unknown as TokenResponse);
  redirect(destination);
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
  await clearPreAuthCookie();
  await clearSessionCookies();
  redirect('/login');
}
