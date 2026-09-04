import { describe, expect, it } from 'vitest';

import {
  parseFriendLook,
  syncRemotePlayers,
} from '@/minigioco-test/social-room/piazza-remote-players.js';

interface RemotePlayer {
  gamertag: string;
  avatar: { look: { hair: string; outfit: string } };
  fx: number;
  fy: number;
  queue: Array<{ cx: number; cy: number }>;
  nextStep: { cx: number; cy: number } | null;
}

describe('avatar remoti della Piazza', () => {
  it('usa soltanto la personalizzazione canonica, incluso il bomber', () => {
    expect(parseFriendLook('look:f2:jacket')).toEqual({ hair: 'f2', outfit: 'jacket' });
    expect(parseFriendLook('look:guest:poncho')).toEqual({ hair: 'm3', outfit: 'tank' });
    expect(parseFriendLook('crown')).toEqual({ hair: 'm3', outfit: 'tank' });
  });

  it('accoda le caselle realmente ricevute senza ricalcolare una strada locale', () => {
    const players = new Map<string, RemotePlayer>();
    const buildAvatar = (look: { hair: string; outfit: string }) => ({ look });
    const base = {
      peerId: 'player-friend',
      gamertag: 'Neko',
      avatarId: 'look:f1:shirt',
      isSelf: false,
      bubble: null,
    };

    const first = { sequence: 1, position: { x: 9, y: 3 }, reset: true };
    const second = { sequence: 2, position: { x: 8, y: 3 }, reset: false };
    const third = { sequence: 3, position: { x: 8, y: 4 }, reset: false };
    syncRemotePlayers(players, [{ ...base, position: first.position, movementTrail: [first] }], buildAvatar);
    syncRemotePlayers(players, [{ ...base, position: second.position, movementTrail: [first, second] }], buildAvatar);
    syncRemotePlayers(players, [{ ...base, position: third.position, movementTrail: [first, second, third] }], buildAvatar);

    expect(players.get('player-friend')?.avatar.look).toEqual({ hair: 'f1', outfit: 'shirt' });
    expect(players.get('player-friend')?.queue).toEqual([
      { cx: 8, cy: 3 },
      { cx: 8, cy: 4 },
    ]);
  });

  it('corregge uno snapshot o un gap senza inventare movimento diagonale', () => {
    const players = new Map<string, RemotePlayer>();
    const buildAvatar = (look: { hair: string; outfit: string }) => ({ look });
    const base = {
      peerId: 'player-friend',
      gamertag: 'Neko',
      avatarId: 'look:f1:shirt',
      isSelf: false,
      bubble: null,
    };

    syncRemotePlayers(players, [{
      ...base,
      position: { x: 8, y: 3 },
      movementTrail: [{ sequence: 1, position: { x: 8, y: 3 }, reset: true }],
    }], buildAvatar);
    syncRemotePlayers(players, [{
      ...base,
      position: { x: 2, y: 8 },
      movementTrail: [
        { sequence: 1, position: { x: 8, y: 3 }, reset: true },
        { sequence: 9, position: { x: 2, y: 8 }, reset: false },
      ],
    }], buildAvatar);

    expect(players.get('player-friend')).toMatchObject({
      fx: 2,
      fy: 8,
      queue: [],
      nextStep: null,
    });
  });
});
