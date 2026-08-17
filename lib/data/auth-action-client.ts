import 'server-only';

import { headers } from 'next/headers';
import { config } from '@/lib/config';
import {
  applyTrustedDeviceResponse,
  getTrustedDeviceForwardHeaders,
} from '@/lib/auth/trusted-device';
import { validateSuccessfulAuthResponse } from '@/lib/auth/auth-bff-contract';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';
import { getRateLimitClientIpFromHeaders } from '@/lib/security/client-ip';
import {
  enforceServerRateLimit,
  statusForServerRateLimitError,
} from '@/lib/security/server-rate-limit';

function unwrap(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const data = (payload as Record<string, unknown>).data;
  return (data && typeof data === 'object' ? data : payload) as Record<string, unknown>;
}

export function extractAuthError(body: Record<string, unknown>, fallback: string): string {
  return (
    (typeof body.detail === 'string' && body.detail) ||
    (typeof body.message === 'string' && body.message) ||
    fallback
  );
}

export async function authRateLimitError(
  scope: string,
  subject: string,
  identityLimit: number,
  ipLimit: number,
): Promise<string | null> {
  try {
    await enforceServerRateLimit({
      scope: `${scope}:identity`,
      subject,
      limit: identityLimit,
      requireDistributedStore: true,
    });
    await enforceServerRateLimit({
      scope: `${scope}:ip`,
      subject: getRateLimitClientIpFromHeaders(await headers()),
      limit: ipLimit,
      requireDistributedStore: true,
    });
    return null;
  } catch (error) {
    return statusForServerRateLimitError(error) === 429
      ? 'Troppi tentativi. Attendi un minuto e riprova.'
      : 'Servizio di autenticazione temporaneamente non disponibile.';
  }
}

export async function authFetch(
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  if (!config.api.baseURL) {
    return { ok: false, body: { message: 'Servizio di autenticazione non configurato' } };
  }

  try {
    const trustedDeviceHeaders = await getTrustedDeviceForwardHeaders(path);
    const response = await fetch(`${config.api.baseURL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
        ...trustedDeviceHeaders,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(config.api.timeout),
    });
    const parsed = unwrap(
      await readBoundedResponseJson(response, 512 * 1024).catch(() => ({})),
    );
    const contractPath = path.replace(/^\/api\/auth\//, '');
    if (response.ok && !validateSuccessfulAuthResponse(contractPath, parsed).valid) {
      return {
        ok: false,
        body: { message: 'Risposta del servizio di autenticazione non valida' },
      };
    }
    await applyTrustedDeviceResponse(path, response.headers);
    return { ok: response.ok, body: parsed };
  } catch {
    return {
      ok: false,
      body: { message: 'Impossibile contattare il servizio di autenticazione' },
    };
  }
}
