import { describe, expect, it } from 'vitest';
import { redactAuthPayload } from '@/lib/auth/bff-redaction';

describe('auth BFF redaction', () => {
  it('removes credentials recursively while preserving non-secret response data', () => {
    expect(redactAuthPayload({
      access_token: 'access',
      data: {
        refresh_token: 'refresh',
        user: { id: 'u1', token: 'nested-secret', email: 'a@example.test' },
      },
      mfa_required: true,
      pre_auth_token: 'pre-auth',
    })).toEqual({
      data: { user: { id: 'u1', email: 'a@example.test' } },
      mfa_required: true,
    });
  });
});
