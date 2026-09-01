import { describe, expect, it } from 'vitest';
import {
  peerFailureStateShouldReportLoss,
  peerTransportIsConnected,
  peerTransportIsLost,
  peerPresenceSignalShouldReportLoss,
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

  it('non trasforma heartbeat/offline remoto in perdita con trasporto locale sano', () => {
    expect(peerPresenceSignalShouldReportLoss('connected', 'connected')).toBe(false);
    expect(peerPresenceSignalShouldReportLoss('connected', 'completed')).toBe(false);
    expect(peerPresenceSignalShouldReportLoss('connected', 'disconnected')).toBe(true);
  });

  it('non trasforma errori media o signaling in incidenti dopo una connessione sana', () => {
    expect(peerFailureStateShouldReportLoss(true, 'connected', 'connected')).toBe(false);
    expect(peerFailureStateShouldReportLoss(true, 'connected', 'completed')).toBe(false);
    expect(peerFailureStateShouldReportLoss(true, 'connected', 'failed')).toBe(true);
    expect(peerFailureStateShouldReportLoss(false, 'connecting', 'checking')).toBe(true);
  });
});
