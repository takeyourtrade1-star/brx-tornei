import { describe, expect, it } from 'vitest';
import {
  buildTrustedDeviceRequestCookie,
  getTrustedDeviceAuthPolicy,
  MFA_TRUST_COOKIE,
  MFA_TRUST_MAX_AGE,
  parseTrustedDeviceSetCookies,
  serializeTrustedDeviceCookie,
} from '@/lib/auth/trusted-device-cookie';

describe('trusted-device cookie MFA', () => {
  it('inoltra il cookie solo ai due endpoint che lo consumano', () => {
    expect(getTrustedDeviceAuthPolicy('/api/auth/login')).toMatchObject({
      forwardCookie: true,
    });
    expect(getTrustedDeviceAuthPolicy('/api/auth/login/code/verify')).toMatchObject({
      forwardCookie: true,
    });
    expect(getTrustedDeviceAuthPolicy('/api/auth/verify-mfa')).toMatchObject({
      forwardCookie: false,
    });
  });

  it('inoltra User-Agent e accetta Set-Cookie solo sui tre endpoint MFA', () => {
    for (const path of [
      '/api/auth/login',
      '/api/auth/login/code/verify',
      '/api/auth/verify-mfa',
    ]) {
      expect(getTrustedDeviceAuthPolicy(path)).toMatchObject({
        forwardUserAgent: true,
        acceptSetCookie: true,
      });
    }
  });

  it('usa match esatti e rifiuta endpoint generici o sotto-path', () => {
    for (const path of [
      '/api/auth/login/code/request',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/me',
      '/api/auth/logout',
      '/api/auth/login/extra',
      '/api/auth/verify-mfa/extra',
    ]) {
      expect(getTrustedDeviceAuthPolicy(path)).toEqual({
        forwardCookie: false,
        forwardUserAgent: false,
        acceptSetCookie: false,
      });
    }
  });

  it('inoltra esclusivamente il cookie trusted-device', () => {
    expect(buildTrustedDeviceRequestCookie('opaque.token_123')).toBe(
      `${MFA_TRUST_COOKIE}=opaque.token_123`
    );
  });

  it('rifiuta valori che potrebbero iniettare header', () => {
    expect(buildTrustedDeviceRequestCookie('token; other=bad')).toBeNull();
    expect(buildTrustedDeviceRequestCookie('token\r\nX-Test: bad')).toBeNull();
  });

  it('estrae il token e limita la durata a 30 giorni', () => {
    expect(
      parseTrustedDeviceSetCookies([
        `${MFA_TRUST_COOKIE}=opaque-token; Path=/; Max-Age=${MFA_TRUST_MAX_AGE * 2}; Secure; HttpOnly`,
      ])
    ).toEqual({ value: 'opaque-token', maxAge: MFA_TRUST_MAX_AGE });
  });

  it('propaga la cancellazione del cookie', () => {
    expect(
      parseTrustedDeviceSetCookies([
        `${MFA_TRUST_COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly`,
      ])
    ).toEqual({ value: '', maxAge: 0 });
  });

  it('ignora ogni Set-Cookie non appartenente al contratto MFA', () => {
    expect(parseTrustedDeviceSetCookies(['session=secret; Path=/'])).toBeNull();
  });

  it('serializza sempre un cookie __Host- senza Domain e con flag sicuri', () => {
    const serialized = serializeTrustedDeviceCookie({
      value: 'opaque-token',
      maxAge: MFA_TRUST_MAX_AGE,
    });

    expect(serialized).toContain(`${MFA_TRUST_COOKIE}=opaque-token`);
    expect(serialized).toContain('Path=/');
    expect(serialized).toContain('HttpOnly');
    expect(serialized).toContain('Secure');
    expect(serialized).toContain('SameSite=Lax');
    expect(serialized).not.toContain('Domain=');
  });
});
