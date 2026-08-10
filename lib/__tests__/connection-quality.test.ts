import { describe, expect, it } from 'vitest';
import {
  classifyConnectionQuality,
  connectionQualityLabel,
} from '@/lib/webrtc/connection-quality';

describe('connection quality', () => {
  it('classifica latenza, perdita e jitter con soglie conservative', () => {
    expect(classifyConnectionQuality({ rttMs: 70, packetLossPct: 0.2, jitterMs: 8, transport: 'direct' })).toBe('good');
    expect(classifyConnectionQuality({ rttMs: 190, transport: 'server' })).toBe('fair');
    expect(classifyConnectionQuality({ packetLossPct: 7, transport: 'relay' })).toBe('poor');
    expect(classifyConnectionQuality({ online: false, transport: 'unknown' })).toBe('poor');
  });

  it('produce un testo breve per badge e ready check', () => {
    expect(connectionQualityLabel()).toBe('Verifica in corso');
    expect(connectionQualityLabel({ level: 'good', rttMs: 54, transport: 'direct' })).toBe('Buona · 54 ms');
  });
});
