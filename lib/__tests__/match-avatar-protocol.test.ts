import { describe, expect, it } from 'vitest';
import {
  encodeMatchAvatarCommand,
  isMatchAvatarMessage,
  parseMatchAvatarCommand,
} from '@/lib/match-avatar-protocol';

describe('match avatar protocol', () => {
  it('codifica e valida un avatar annunciato', () => {
    const command = { type: 'announce', senderId: 'player-1', avatarId: 'flame' } as const;
    const encoded = encodeMatchAvatarCommand(command);

    expect(isMatchAvatarMessage(encoded)).toBe(true);
    expect(parseMatchAvatarCommand(encoded)).toEqual(command);
  });

  it('codifica una richiesta di sincronizzazione', () => {
    const command = { type: 'sync-request', senderId: 'player-2' } as const;
    expect(parseMatchAvatarCommand(encodeMatchAvatarCommand(command))).toEqual(command);
  });

  it('rifiuta payload malformati o avatar fuori limite', () => {
    expect(parseMatchAvatarCommand('ciao')).toBeNull();
    expect(parseMatchAvatarCommand('[[BRX_AVATAR_V1]]not-json')).toBeNull();
    expect(parseMatchAvatarCommand(
      `[[BRX_AVATAR_V1]]${JSON.stringify({
        type: 'announce',
        senderId: 'player-1',
        avatarId: 'x'.repeat(41),
      })}`,
    )).toBeNull();
  });
});
