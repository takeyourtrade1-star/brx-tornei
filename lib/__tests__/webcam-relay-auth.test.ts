import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  issueWebcamRelayCapability,
  verifyWebcamRelayCapability,
} from '@/lib/webrtc/webcam-relay-auth';

const SESSION_ID = '019f986b-2ca1-7f80-8b9f-6b1107187807';

describe('webcam relay capability', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv(
      'WEBCAM_RELAY_SECRET',
      'test-secret-with-enough-entropy-for-hmac',
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is bound to the session and role', () => {
    const token = issueWebcamRelayCapability(SESSION_ID, 'host', 1_000);
    expect(token).toBeTruthy();
    expect(
      verifyWebcamRelayCapability(token, SESSION_ID, 'host', 1_001),
    ).toBe(true);
    expect(
      verifyWebcamRelayCapability(token, SESSION_ID, 'guest', 1_001),
    ).toBe(false);
    expect(
      verifyWebcamRelayCapability(
        token,
        '119f986b-2ca1-7f80-8b9f-6b1107187807',
        'host',
        1_001,
      ),
    ).toBe(false);
  });

  it('rejects tampering and expiry', () => {
    const token = issueWebcamRelayCapability(SESSION_ID, 'guest', 1_000)!;
    expect(
      verifyWebcamRelayCapability(`${token}x`, SESSION_ID, 'guest', 1_001),
    ).toBe(false);
    expect(
      verifyWebcamRelayCapability(token, SESSION_ID, 'guest', 1_601),
    ).toBe(false);
  });

  it('fails closed in production without a signing secret', () => {
    vi.stubEnv('WEBCAM_RELAY_SECRET', '');
    expect(issueWebcamRelayCapability(SESSION_ID, 'host', 1_000)).toBeNull();
  });
});
