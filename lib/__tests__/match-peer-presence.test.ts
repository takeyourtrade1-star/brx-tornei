import { describe, expect, it } from 'vitest';
import {
  peerTransportIsConnected,
  peerTransportIsLost,
} from '@/lib/webrtc/match-peer-link';

describe('P2P presence classification', () => {
  it('requires both the aggregate connection and ICE transport to be healthy', () => {
    expect(peerTransportIsConnected('connected', 'connected')).toBe(true);
    expect(peerTransportIsConnected('connected', 'completed')).toBe(true);
    expect(peerTransportIsConnected('connected', 'disconnected')).toBe(false);
    expect(peerTransportIsConnected('connecting', 'connected')).toBe(false);
  });

  it('detects loss from either the aggregate state or ICE state', () => {
    expect(peerTransportIsLost('disconnected', 'connected')).toBe(true);
    expect(peerTransportIsLost('connected', 'disconnected')).toBe(true);
    expect(peerTransportIsLost('failed', 'connected')).toBe(true);
    expect(peerTransportIsLost('connected', 'failed')).toBe(true);
    expect(peerTransportIsLost('connected', 'completed')).toBe(false);
  });
});
