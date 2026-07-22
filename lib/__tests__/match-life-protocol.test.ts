import { describe, expect, it } from 'vitest';
import {
  clampLife,
  encodeMatchLifeCommand,
  isMatchLifeMessage,
  parseMatchLifeCommand,
} from '@/lib/match-life-protocol';

describe('protocollo punti vita', () => {
  it('codifica e decodifica una variazione', () => {
    const command = { type: 'delta', targetId: 'player-2', delta: -5, senderId: 'player-1' } as const;
    const encoded = encodeMatchLifeCommand(command);

    expect(isMatchLifeMessage(encoded)).toBe(true);
    expect(parseMatchLifeCommand(encoded)).toEqual(command);
  });

  it('mantiene l’identificativo che evita di applicare due volte click rapidi', () => {
    const command = {
      type: 'setup',
      startingLife: 20,
      senderId: 'player-1',
      commandId: 'player-1:123:2',
    } as const;

    expect(parseMatchLifeCommand(encodeMatchLifeCommand(command))).toEqual(command);
  });

  it('sincronizza il reset solo per il giocatore che lo invia', () => {
    const command = {
      type: 'reset',
      targetId: 'player-2',
      senderId: 'player-2',
      revision: 3,
      commandId: 'player-2:124:1',
    } as const;

    expect(parseMatchLifeCommand(encodeMatchLifeCommand(command))).toEqual(command);
  });

  it('rifiuta revisioni non valide', () => {
    expect(parseMatchLifeCommand('[[BRX_LIFE_V1]]{"type":"reset","targetId":"a","senderId":"a","revision":-1}')).toBeNull();
  });

  it('rifiuta payload non validi', () => {
    expect(parseMatchLifeCommand('ciao')).toBeNull();
    expect(parseMatchLifeCommand('[[BRX_LIFE_V1]]{"type":"delta","delta":1000}')).toBeNull();
    expect(parseMatchLifeCommand('[[BRX_LIFE_V1]]{"type":"setup","startingLife":20,"senderId":"a","commandId":""}')).toBeNull();
  });

  it('limita la vita tra zero e 999', () => {
    expect(clampLife(-3)).toBe(0);
    expect(clampLife(42.4)).toBe(42);
    expect(clampLife(1200)).toBe(999);
  });
});
