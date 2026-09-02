'use server';

import { redirect } from 'next/navigation';
import { config } from '@/lib/config';
import {
  clearSessionCookies,
  getAccessToken,
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
  isValidAuthCookieToken,
  isValidAuthTokenPair,
} from '@/lib/auth/auth-token';
import {
  authFetch,
  extractAuthError,
} from '@/lib/data/auth-action-client';
import {
  buildLoginPayload,
  loginCodeRequestSchema,
  loginCodeVerifySchema,
  loginSchema,
  verifyMfaFormSchema,
} from '@/lib/validations/auth';
import type { AuthActionState } from '@/types/auth';

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
    return { error: extractAuthError(response, 'Credenziali non valide') };
  }

  // Una nuova risposta login non deve ereditare un hand-off MFA obsoleto.
  await clearPreAuthCookie();

  if (response.mfa_required === true) {
    if (!isValidAuthCookieToken(response.pre_auth_token)) {
      return { error: 'Risposta MFA non valida' };
    }
    await setPreAuthCookie(response.pre_auth_token);
    redirect(`/login/verify-mfa?redirect=${encodeURIComponent(destination)}`);
  }

  if (!isValidAuthTokenPair(response)) {
    return { error: 'Risposta login non valida' };
  }

  await setSessionCookies(response);
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
    return { error: extractAuthError(response, 'Codice MFA non valido') };
  }

  if (!isValidAuthTokenPair(response)) {
    return { error: 'Risposta verifica MFA non valida' };
  }

  await setSessionCookies(response);
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
    return { error: extractAuthError(body, 'Impossibile inviare il codice') };
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
    return { error: extractAuthError(response, 'Codice non valido o scaduto') };
  }

  // Il nuovo tentativo sostituisce sempre l'eventuale hand-off precedente.
  await clearPreAuthCookie();

  if (response.mfa_required === true) {
    if (!isValidAuthCookieToken(response.pre_auth_token)) {
      return { error: 'Risposta MFA non valida' };
    }
    await setPreAuthCookie(response.pre_auth_token);
    redirect(`/login/verify-mfa?redirect=${encodeURIComponent(destination)}`);
  }

  if (!isValidAuthTokenPair(response)) {
    return { error: 'Risposta login codice non valida' };
  }

  await setSessionCookies(response);
  redirect(destination);
}

/** Logout: invalida la sessione sul backend e cancella i cookie parent-domain. */
export async function logoutAction(): Promise<void> {
  const [refreshToken, accessToken] = await Promise.all([
    getRefreshToken(),
    getAccessToken(),
  ]);
  if (refreshToken && config.api.baseURL) {
    try {
      await fetch(`${config.api.baseURL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'identity',
          // Il backend richiede get_current_user: senza bearer il logout remoto
          // fallisce sempre e la sessione resta valida lato server.
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: 'no-store',
        redirect: 'error',
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
