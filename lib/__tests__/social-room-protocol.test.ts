import { describe, expect, it } from 'vitest';
import {
  MAX_CHAT_LENGTH,
  createChatEvent,
  createMoveEvent,
  normalizePosition,
  parseSocialRoomEvent,
  sanitizeChatText,
} from '@/minigioco-test/social-room/social-room-protocol';

describe('protocollo Sala Piazza', () => {
  it('sanitizza i messaggi e applica il limite della bolla', () => {
    const text = sanitizeChatText(`  Ciao <amico>\n\u0000  ${'x'.repeat(MAX_CHAT_LENGTH)}  `);

    expect(text).not.toContain('<');
    expect(text).not.toContain('>');
    expect(text.length).toBeLessThanOrEqual(MAX_CHAT_LENGTH);
    expect(sanitizeChatText('   ')).toBe('');
  });

  it('valida stanza, identità e coordinate degli eventi ricevuti', () => {
    const event = createMoveEvent({
      roomId: 'social-room',
      peerId: 'tab-one',
      gamertag: 'Neko',
      avatarId: 'avatar-fox',
      position: { x: 8, y: 3 },
      sequence: 1,
      sentAt: 1,
    });

    expect(parseSocialRoomEvent(event, 'social-room')).toMatchObject({
      type: 'move',
      roomId: 'social-room',
      position: { x: 8, y: 3 },
    });
    expect(parseSocialRoomEvent({ ...event, roomId: 'other-room' }, 'social-room')).toBeNull();
    expect(parseSocialRoomEvent({ ...event, peerId: '<script>' }, 'social-room')).toBeNull();
    expect(parseSocialRoomEvent({ ...event, position: { x: 99, y: -4 } }, 'social-room')).toBeNull();
  });

  it('rifiuta chat vuote e normalizza soltanto coordinate finite', () => {
    expect(createChatEvent({
      roomId: 'social-room',
      peerId: 'tab-one',
      gamertag: 'Neko',
      avatarId: 'avatar-fox',
      text: '   ',
      sequence: 1,
    })).toBeNull();

    expect(normalizePosition({ x: Number.NaN, y: 1 })).toBeNull();
    expect(normalizePosition({ x: -5, y: 99 })).toBeNull();
    expect(normalizePosition({ x: 8.5, y: 3 })).toBeNull();
  });
});
