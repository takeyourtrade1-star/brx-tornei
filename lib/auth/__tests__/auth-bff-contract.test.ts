import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  isAllowedAuthRoute,
  validateSuccessfulAuthResponse,
} from '@/lib/auth/auth-bff-contract';
import { config } from '@/lib/config';

describe('auth BFF contract', () => {
  it('applica una allowlist esatta di path e metodo', () => {
    expect(isAllowedAuthRoute('login', 'POST')).toBe(true);
    expect(isAllowedAuthRoute('me', 'GET')).toBe(true);
    expect(isAllowedAuthRoute('login', 'GET')).toBe(false);
    expect(isAllowedAuthRoute('me', 'POST')).toBe(false);
    expect(isAllowedAuthRoute('login/extra', 'POST')).toBe(false);
    expect(isAllowedAuthRoute('password/reset', 'POST')).toBe(false);
  });

  it('accetta una coppia sessione completa soltanto dagli issuer reali e clampa il TTL', () => {
    const payload = {
      access_token: 'access.token-1',
      refresh_token: 'refresh.token-1',
      expires_in: Number.MAX_SAFE_INTEGER,
    };
    expect(validateSuccessfulAuthResponse('login', payload)).toEqual({
      valid: true,
      outcome: 'session',
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      accessMaxAge: config.auth.accessMaxAge,
    });
    expect(validateSuccessfulAuthResponse('register', payload)).toEqual({
      valid: false,
      outcome: 'none',
    });
  });

  it('propaga un expires_in valido inferiore al fallback locale', () => {
    expect(validateSuccessfulAuthResponse('refresh', {
      access_token: 'access.short',
      refresh_token: 'refresh.short',
      expires_in: 75,
    })).toEqual({
      valid: true,
      outcome: 'session',
      accessToken: 'access.short',
      refreshToken: 'refresh.short',
      accessMaxAge: 75,
    });
  });

  it.each([
    { access_token: 'access-only' },
    { refresh_token: 'refresh-only' },
    { access_token: 'access', refresh_token: 'caf\u00e9' },
    { access_token: 'access', refresh_token: `r${'x'.repeat(3_800)}` },
  ])('rifiuta coppie parziali o token non validi: %j', (payload) => {
    expect(validateSuccessfulAuthResponse('refresh', payload)).toEqual({
      valid: false,
      outcome: 'none',
    });
  });

  it('accetta pre-auth soltanto da login e code-verify', () => {
    const payload = { pre_auth_token: 'pre.auth-token', mfa_required: true };
    expect(validateSuccessfulAuthResponse('login/code/verify', payload)).toEqual({
      valid: true,
      outcome: 'preauth',
      preAuthToken: payload.pre_auth_token,
    });
    expect(validateSuccessfulAuthResponse('verify-mfa', payload)).toEqual({
      valid: false,
      outcome: 'none',
    });
  });

  it.each([
    'aaaaaaaa.bbbbbbbb.cccccccc',
    { accessToken: 'alias', refreshToken: 'alias' },
    { data: { nested: { preAuthToken: 'alias' } } },
    { data: { access_token: 'access', refresh_token: 'refresh' }, token: 'alias' },
  ])('rifiuta primitive e alias di credenziali inattesi: %j', (payload) => {
    expect(validateSuccessfulAuthResponse('login', payload)).toEqual({
      valid: false,
      outcome: 'none',
    });
  });

  it('accetta un DTO pubblico senza credenziali su una rotta non issuer', () => {
    expect(validateSuccessfulAuthResponse('login/code/request', {
      message: 'Se l’account esiste, il codice è stato inviato.',
    })).toEqual({ valid: true, outcome: 'none' });
  });
});
