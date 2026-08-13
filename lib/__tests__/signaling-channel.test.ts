import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignalingChannel, type SignalMessage } from '@/lib/webrtc/signaling';

describe('SignalingChannel recovery', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('processes messages sequentially and skips stale offers in one history batch', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://tornei.ebartex.com' } });
    const messages: SignalMessage[] = [
      { seq: 1, from: 'host', kind: 'offer', data: { attemptId: 'old' } },
      { seq: 2, from: 'host', kind: 'candidate', data: { attemptId: 'old' } },
      { seq: 3, from: 'host', kind: 'offer', data: { attemptId: 'new' } },
    ];
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ messages })));
    const seen: number[] = [];
    let channel: SignalingChannel;
    channel = new SignalingChannel('session', 'guest', async (message) => {
      await Promise.resolve();
      seen.push(message.seq);
      if (message.seq === 3) channel.setConnected(true);
    });
    channel.start();
    await vi.waitFor(() => expect(seen).toEqual([2, 3]));
    channel.stop();
  });

  it('closes instead of polling forever after an authorization failure', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://tornei.ebartex.com' } });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 401 })));
    const closed = vi.fn();
    const channel = new SignalingChannel('session', 'guest', vi.fn(), undefined, closed);
    channel.start();
    await vi.waitFor(() => expect(closed).toHaveBeenCalledOnce());
    channel.stop();
  });
});
