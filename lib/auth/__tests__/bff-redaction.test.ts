import { describe, expect, it } from 'vitest';
import { projectAuthPayload } from '@/lib/auth/bff-redaction';

describe('auth BFF positive projections', () => {
  it('espone soltanto l’esito pubblico di una sessione creata', () => {
    expect(projectAuthPayload('login', {
      access_token: 'access',
      refresh_token: 'refresh',
      token_type: 'bearer',
      accessToken: 'alias',
      nested: { jwt: 'nested-secret' },
    }, { ok: true, outcome: 'session' })).toEqual({ authenticated: true });
  });

  it('non inoltra primitive JWT o alias annidati inattesi', () => {
    const jwt = 'aaaaaaaa.bbbbbbbb.cccccccc';
    expect(projectAuthPayload('login/code/request', jwt, { ok: true })).toEqual({});
    expect(projectAuthPayload('login/code/request', {
      message: jwt,
      data: { accessToken: 'must-not-leak' },
    }, { ok: true })).toEqual({});
  });

  it('preserva i soli campi pubblici di registrazione e utente', () => {
    expect(projectAuthPayload('register', {
      status: 'verification_pending',
      flow_id: 'flow-1',
      destination: 'm***@example.test',
      expires_at: '2026-08-17T12:00:00Z',
      resend_available_at: '2026-08-17T11:55:00Z',
      delivery_status: 'queued',
      internal_note: 'drop-me',
    }, { ok: true })).toEqual({
      status: 'verification_pending',
      flow_id: 'flow-1',
      destination: 'm***@example.test',
      expires_at: '2026-08-17T12:00:00Z',
      resend_available_at: '2026-08-17T11:55:00Z',
      delivery_status: 'queued',
    });
  });
});
