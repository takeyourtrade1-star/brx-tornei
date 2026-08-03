import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  consumeWebcamGuestClaim,
  decodeWebcamRelayCapability,
  issueWebcamRelayGrant,
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

  it('exchanges the phone claim exactly once and keeps it session-scoped', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const grant = await issueWebcamRelayGrant(SESSION_ID);
    expect(grant).toBeTruthy();
    const wrong = await consumeWebcamGuestClaim(
      '119f986b-2ca1-7f80-8b9f-6b1107187807',
      grant!.guestClaim,
    );
    expect(wrong).toBeNull();
    // A mismatched redemption burns the random claim, preventing probing/replay.
    expect(await consumeWebcamGuestClaim(SESSION_ID, grant!.guestClaim)).toBeNull();

    const second = await issueWebcamRelayGrant(SESSION_ID);
    const token = await consumeWebcamGuestClaim(SESSION_ID, second!.guestClaim);
    expect(verifyWebcamRelayCapability(token, SESSION_ID, 'guest')).toBe(true);
    expect(await consumeWebcamGuestClaim(SESSION_ID, second!.guestClaim)).toBeNull();
  });

  it('isolates independent grants for the same webcam session', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const first = await issueWebcamRelayGrant(SESSION_ID);
    const second = await issueWebcamRelayGrant(SESSION_ID);
    const firstCapability = decodeWebcamRelayCapability(
      first!.hostToken,
      SESSION_ID,
      'host',
    );
    const secondCapability = decodeWebcamRelayCapability(
      second!.hostToken,
      SESSION_ID,
      'host',
    );
    expect(firstCapability).toBeTruthy();
    expect(secondCapability).toBeTruthy();
    expect(firstCapability!.relayId).not.toBe(secondCapability!.relayId);
  });
});
