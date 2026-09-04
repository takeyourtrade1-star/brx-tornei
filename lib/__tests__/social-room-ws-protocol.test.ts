import { describe, expect, it } from 'vitest';

import { parseSocialRoomServerControlFrame } from '@/lib/social-room-ws-protocol';

describe('frame di controllo server Sala Piazza', () => {
  it('accetta authenticated con identità opaca assegnata dal server', () => {
    expect(parseSocialRoomServerControlFrame({
      event: 'authenticated',
      peer_id: 'player-acde0123',
      server_time: 1_000,
    })).toEqual({
      event: 'authenticated',
      peerId: 'player-acde0123',
    });
    expect(parseSocialRoomServerControlFrame('{"event":"authenticated"}')).toBeNull();
    expect(parseSocialRoomServerControlFrame({ event: 'authenticated', user_id: 'spoof' })).toBeNull();
  });

  it('normalizza un ack correlato a una sequenza client', () => {
    expect(parseSocialRoomServerControlFrame(JSON.stringify({
      event: 'ack',
      client_sequence: 7,
      accepted: true,
      event_id: 'evt-7',
      reason: 'ok',
    }))).toEqual({
      event: 'ack',
      clientSequence: 7,
      accepted: true,
      eventId: 'evt-7',
      reason: 'ok',
    });
  });

  it.each([
    { event: 'ack', client_sequence: 0, accepted: true },
    { event: 'ack', client_sequence: 1.5, accepted: true },
    { event: 'ack', client_sequence: 1, accepted: 'true' },
    { event: 'ack', accepted: true },
    { event: 'ack', client_sequence: 1, accepted: false, extra: true },
    { event: 'ack', client_sequence: 1, accepted: false, reason: '\u0000' },
  ])('rifiuta il frame fuori contratto: %j', (frame) => {
    expect(parseSocialRoomServerControlFrame(frame)).toBeNull();
  });

  it('rifiuta JSON non valido e frame oltre il limite', () => {
    expect(parseSocialRoomServerControlFrame('{')).toBeNull();
    expect(parseSocialRoomServerControlFrame('x'.repeat(16 * 1024 + 1))).toBeNull();
    expect(parseSocialRoomServerControlFrame({ event: 'chat', text: 'non-control' })).toBeNull();
  });
});
