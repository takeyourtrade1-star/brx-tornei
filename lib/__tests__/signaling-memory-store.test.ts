import { describe, expect, it } from 'vitest';

import { SignalingSessionLimitError } from '@/lib/webrtc/signaling-errors';
import { memoryAppend } from '@/lib/webrtc/signaling-memory-store';

describe('quota aggregata relay webcam', () => {
  it('non si azzera cambiando relayId nella stessa sessione autorizzata', () => {
    const quota = `quota-${crypto.randomUUID()}`;
    const firstRelay = `relay-a-${crypto.randomUUID()}`;
    const secondRelay = `relay-b-${crypto.randomUUID()}`;
    for (let index = 0; index < 150; index += 1) {
      memoryAppend(firstRelay, quota, 'host', 'candidate', { index });
      memoryAppend(secondRelay, quota, 'guest', 'candidate', { index });
    }
    expect(() => memoryAppend(firstRelay, quota, 'host', 'candidate', {}))
      .toThrow(SignalingSessionLimitError);

    expect(() => memoryAppend(
      `relay-c-${crypto.randomUUID()}`,
      `other-${crypto.randomUUID()}`,
      'host',
      'offer',
      {},
    )).not.toThrow();
  });
});
