import { describe, expect, it } from 'vitest';
import {
  MAX_CHAT_LENGTH,
  SOCIAL_ROOM_BOUNDS,
  createChatEvent,
  createMoveEvent,
  getDeterministicIdlePosition,
  normalizeSeedFriends,
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

  it('mostra solo gli amici con presenza online o in partita', () => {
    const players = normalizeSeedFriends(
      [
        { id: 'online', gamertag: 'Online', avatarId: 'fox', presence: 'online' },
        { id: 'playing', gamertag: 'Playing', avatarId: 'dragon', presence: 'in_game' },
        { id: 'dnd', gamertag: 'Busy', avatarId: 'robot', presence: 'dnd' },
        { id: 'offline', gamertag: 'Away', avatarId: 'panda', presence: 'offline' },
        { id: 'self', gamertag: 'mE', avatarId: 'self', presence: 'online' },
      ],
      'social-room',
      'Me',
    );

    expect(players.map(({ player }) => player.gamertag)).toEqual(['Online', 'Playing']);
  });

  it('valida stanza, identità e coordinate degli eventi ricevuti', () => {
    const event = createMoveEvent({
      roomId: 'social-room',
      peerId: 'tab-one',
      gamertag: 'Neko',
      avatarId: 'avatar-fox',
      position: { x: 99, y: -4 },
      sequence: 1,
      sentAt: 1,
    });

    expect(parseSocialRoomEvent(event, 'social-room')).toMatchObject({
      type: 'move',
      roomId: 'social-room',
      position: { x: SOCIAL_ROOM_BOUNDS.maxX, y: SOCIAL_ROOM_BOUNDS.minY },
    });
    expect(parseSocialRoomEvent({ ...event, roomId: 'other-room' }, 'social-room')).toBeNull();
    expect(parseSocialRoomEvent({ ...event, peerId: '<script>' }, 'social-room')).toBeNull();
  });

  it('rifiuta chat vuote e mantiene il movimento cosmetico nei limiti', () => {
    expect(createChatEvent({
      roomId: 'social-room',
      peerId: 'tab-one',
      gamertag: 'Neko',
      avatarId: 'avatar-fox',
      text: '   ',
      sequence: 1,
    })).toBeNull();

    const position = getDeterministicIdlePosition(
      'seed-one',
      { x: 1, y: 1 },
      Number.MAX_SAFE_INTEGER,
    );
    expect(position.x).toBeGreaterThanOrEqual(SOCIAL_ROOM_BOUNDS.minX);
    expect(position.x).toBeLessThanOrEqual(SOCIAL_ROOM_BOUNDS.maxX);
    expect(position.y).toBeGreaterThanOrEqual(SOCIAL_ROOM_BOUNDS.minY);
    expect(position.y).toBeLessThanOrEqual(SOCIAL_ROOM_BOUNDS.maxY);
  });
});
