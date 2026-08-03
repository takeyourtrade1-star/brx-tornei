import { describe, expect, it } from 'vitest';

import {
  buildInternalServiceHeaders,
  isCanonicalUuid,
} from '@/lib/security/internal-service-headers';

const token = 't'.repeat(32);
const caller = 'brx-tornei';
const subject = '018f0f8d-5f34-7d9f-8fc2-a12a43ca10d1';

describe('internal service rate-subject headers', () => {
  it('binds a validated session subject to authenticated service calls', () => {
    const headers = buildInternalServiceHeaders({
      requiresInternalToken: true,
      internalToken: token,
      internalCaller: caller,
      rateSubject: subject,
    });
    expect(headers.get('X-Internal-Token')).toBe(token);
    expect(headers.get('X-Internal-Caller')).toBe(caller);
    expect(headers.get('X-Internal-Rate-Subject')).toBe(subject);
  });

  it('accepts canonical UUIDv7/v8 identities and rejects ambiguous forms', () => {
    expect(isCanonicalUuid(subject)).toBe(true);
    expect(isCanonicalUuid('018f0f8d-5f34-8d9f-afc2-a12a43ca10d1')).toBe(true);
    expect(isCanonicalUuid(subject.toUpperCase())).toBe(false);
    expect(isCanonicalUuid(` ${subject}`)).toBe(false);
    expect(isCanonicalUuid(subject.replaceAll('-', ''))).toBe(false);
    expect(isCanonicalUuid('00000000-0000-0000-0000-000000000000')).toBe(false);
    expect(isCanonicalUuid('018f0f8d-5f34-7d9f-7fc2-a12a43ca10d1')).toBe(false);
  });

  it('propagates a real UUIDv7 identity through the authenticated S2S header', () => {
    const headers = buildInternalServiceHeaders({
      requiresInternalToken: true,
      internalToken: token,
      internalCaller: caller,
      rateSubject: subject,
    });
    expect(headers.get('X-Internal-Rate-Subject')).toBe(subject);
  });

  it('never emits a subject for anonymous health calls', () => {
    const headers = buildInternalServiceHeaders({
      requiresInternalToken: true,
      internalToken: token,
      internalCaller: caller,
    });
    expect(headers.get('X-Internal-Rate-Subject')).toBeNull();
  });

  it('does not emit service identity or subject without valid service auth', () => {
    for (const input of [
      { internalToken: undefined, internalCaller: caller },
      { internalToken: token, internalCaller: 'bad caller' },
      { internalToken: 'short', internalCaller: caller },
    ]) {
      const headers = buildInternalServiceHeaders({
        requiresInternalToken: true,
        ...input,
        rateSubject: subject,
      });
      expect(headers.get('X-Internal-Token')).toBeNull();
      expect(headers.get('X-Internal-Caller')).toBeNull();
      expect(headers.get('X-Internal-Rate-Subject')).toBeNull();
    }
  });

  it('rejects a non-UUID rate subject instead of forwarding it', () => {
    const headers = buildInternalServiceHeaders({
      requiresInternalToken: true,
      internalToken: token,
      internalCaller: caller,
      rateSubject: '203.0.113.4, attacker-controlled',
    });
    expect(headers.get('X-Internal-Rate-Subject')).toBeNull();
  });

  it.each([
    subject.toUpperCase(),
    '00000000-0000-0000-0000-000000000000',
    subject.replaceAll('-', ''),
  ])('never emits a non-canonical subject: %s', (invalidSubject) => {
    const headers = buildInternalServiceHeaders({
      requiresInternalToken: true,
      internalToken: token,
      internalCaller: caller,
      rateSubject: invalidSubject,
    });
    expect(headers.get('X-Internal-Rate-Subject')).toBeNull();
  });
});
