import { describe, expect, it } from 'vitest';
import {
  encodeMatchStartCommand,
  isMatchStartMessage,
  parseMatchStartCommand,
} from '@/lib/match-start-protocol';

describe('protocollo avvio partita', () => {
  it('codifica e decodifica l’istante condiviso', () => {
    const command = { type: 'announce', startsAt: 1_750_000_000_000, senderId: 'host' } as const;
    const encoded = encodeMatchStartCommand(command);

    expect(isMatchStartMessage(encoded)).toBe(true);
    expect(parseMatchStartCommand(encoded)).toEqual(command);
  });

  it('gestisce la richiesta di sincronizzazione', () => {
    const encoded = encodeMatchStartCommand({ type: 'sync-request', senderId: 'guest' });
    expect(parseMatchStartCommand(encoded)).toEqual({ type: 'sync-request', senderId: 'guest' });
  });

  it('rifiuta messaggi e timestamp non validi', () => {
    expect(parseMatchStartCommand('ciao')).toBeNull();
    expect(
      parseMatchStartCommand(
        '[[BRX_START_V1]]{"type":"announce","startsAt":0,"senderId":"host"}',
      ),
    ).toBeNull();
  });
});
