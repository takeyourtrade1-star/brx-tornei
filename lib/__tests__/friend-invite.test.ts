import { describe, expect, it } from 'vitest';

import {
  buildFriendInvitePath,
  buildFriendInviteShareMessage,
  buildFriendInviteUrl,
  parseFriendInviteGamertag,
  stripFriendInviteParam,
} from '@/lib/friend-invite';

describe('friend invite QR', () => {
  it('accetta solo gamertag validi', () => {
    expect(parseFriendInviteGamertag('Alex_TCG')).toBe('Alex_TCG');
    expect(parseFriendInviteGamertag('ab')).toBeNull();
    expect(parseFriendInviteGamertag('bad name')).toBeNull();
    expect(parseFriendInviteGamertag(['Kurogane'])).toBe('Kurogane');
  });

  it('costruisce il path della pagina tornei con add', () => {
    expect(buildFriendInvitePath('Alex_TCG')).toBe(
      '/tornei?format=all&mode=heads-up&add=Alex_TCG',
    );
    expect(buildFriendInvitePath('nope name')).toBe('');
  });

  it('accetta solo origin canonici senza credenziali', () => {
    expect(buildFriendInviteUrl('https://tornei.ebartex.com', 'Alex_TCG')).toBe(
      'https://tornei.ebartex.com/tornei?format=all&mode=heads-up&add=Alex_TCG',
    );
    expect(buildFriendInviteUrl('https://user:pass@evil.test', 'Alex_TCG')).toBe('');
    expect(buildFriendInviteUrl('not-a-url', 'Alex_TCG')).toBe('');
  });

  it('rimuove add lasciando gli altri search params', () => {
    expect(stripFriendInviteParam('format=all&mode=heads-up&add=Alex_TCG')).toBe(
      '?format=all&mode=heads-up',
    );
    expect(stripFriendInviteParam('add=Alex_TCG')).toBe('');
  });

  it('mette il link di amicizia da solo in ultima riga del messaggio di share', () => {
    const url = 'https://tornei.ebartex.com/tornei?format=all&mode=heads-up&add=Alex_TCG';
    const { title, text } = buildFriendInviteShareMessage('Alex_TCG', url);
    expect(title).toBe('Aggiungi Alex_TCG su BRX Tornei');
    expect(text.endsWith(`\n${url}`)).toBe(true);
    expect(text.split('\n').at(-1)).toBe(url);
  });
});
