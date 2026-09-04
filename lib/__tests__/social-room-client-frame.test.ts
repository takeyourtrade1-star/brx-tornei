import { describe, expect, it } from 'vitest';

import { createChatEvent, createMoveEvent } from '@/minigioco-test/social-room/social-room-protocol';
import { toSocialRoomClientFrame } from '@/minigioco-test/social-room/social-room-client-frame';

describe('frame client Sala Piazza', () => {
  it('non trasmette identità, look o timestamp controllabili dal browser', () => {
    const event = createMoveEvent({
      roomId: 'piazza',
      peerId: 'spoofed-peer',
      gamertag: 'Spoofed',
      avatarId: 'look:f3:jacket',
      position: { x: 8, y: 3 },
      sequence: 4,
      sentAt: 99,
    });

    expect(toSocialRoomClientFrame(event)).toEqual({
      type: 'move',
      client_sequence: 4,
      position: { x: 8, y: 3 },
    });
  });

  it('conserva solo testo sanitizzato e correlazione della chat', () => {
    const event = createChatEvent({
      roomId: 'piazza',
      peerId: 'peer',
      gamertag: 'Neko',
      avatarId: 'look:m1:tank',
      text: '  Ciao <Neko>  ',
      sequence: 5,
    });
    if (!event) throw new Error('evento chat non creato');

    expect(toSocialRoomClientFrame(event)).toEqual({
      type: 'chat',
      client_sequence: 5,
      text: 'Ciao Neko',
    });
  });
});
