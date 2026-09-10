import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react-test-renderer';
import { encodeMatchLifeCommand, parseMatchLifeCommand, type MatchLifeCommand } from '@/lib/match-life-protocol';
import { LifeNetwork } from './helpers/match-life-harness';
import type { Participant } from '@/types/tournament';

let network: LifeNetwork;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', {});
  network = new LifeNetwork();
});
afterEach(() => { network.dispose(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const snapshot = {
  type: 'snapshot', senderId: 'host', startingLife: 20,
  lifeByPlayerId: { host: 19, guest: 18 }, revision: 0,
} as const;

const invalidSnapshots: MatchLifeCommand[] = [
    { ...snapshot, senderId: 'outsider' },
    { ...snapshot, lifeByPlayerId: { host: 19 } },
    { ...snapshot, lifeByPlayerId: { host: 19, guest: 18, outsider: 20 } },
    { ...snapshot, requestId: 'richiesta-non-inviata' },
];

describe('validazione delle risposte punti vita', () => {
  it.each(invalidSnapshots)('rifiuta lo stato non valido %# e continua a ritentare', (command) => {
    const guest = network.add('guest');
    network.flush();
    guest.inject(command);
    expect(guest.state.synced).toBe(false);
    expect(guest.state.lifeByPlayerId).toEqual({ host: 20, guest: 20 });
    act(() => { vi.advanceTimersByTime(1_000); });
    network.flush();
    expect(guest.requests).toHaveLength(2);
  });

  it('rifiuta la risposta con revisione vecchia senza sbloccare i comandi', () => {
    const guest = network.add('guest');
    network.flush();
    guest.inject({ type: 'setup', senderId: 'host', startingLife: 40, revision: 2 });
    guest.inject({ ...snapshot, revision: 1, requestId: guest.requests[0].commandId });
    expect(guest.state.synced).toBe(false);
    expect(guest.state.lifeByPlayerId).toEqual({ host: 40, guest: 40 });
    guest.inject({ ...snapshot, revision: 2, requestId: guest.requests[0].commandId });
    expect(guest.state.synced).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('accetta una risposta tardiva di un tentativo corrente, poi ignora i duplicati', () => {
    const guest = network.add('guest');
    network.flush();
    const requestId = guest.requests[0].commandId;
    act(() => { vi.advanceTimersByTime(1_000); });
    network.flush();
    guest.inject({ ...snapshot, requestId });
    expect(guest.state.synced).toBe(true);
    guest.run(() => { guest.state.changeLife('guest', -1); });
    network.flush();
    guest.inject({ ...snapshot, requestId: guest.requests[1].commandId });
    expect(guest.state.lifeByPlayerId.guest).toBe(17);
  });

  it('rifiuta una risposta della connessione precedente con la stessa revisione', () => {
    const guest = network.add('guest');
    network.flush();
    const oldRequestId = guest.requests[0].commandId;
    guest.update({ connected: false });
    guest.update({ connected: true });
    network.flush();
    guest.inject({ ...snapshot, requestId: oldRequestId });
    expect(guest.state.synced).toBe(false);
    guest.inject({ ...snapshot, requestId: guest.requests[1].commandId });
    expect(guest.state.synced).toBe(true);
  });

  it('non rielabora lo storico ricevuto al montaggio come risposta fresca', () => {
    const guest = network.add('guest', { messages: [{
      id: 'old-snapshot', userId: 'host', text: encodeMatchLifeCommand(snapshot), sentAt: 0,
    }] });
    network.flush();
    expect(guest.state.synced).toBe(false);
    expect(guest.state.lifeByPlayerId).toEqual({ host: 20, guest: 20 });
  });

  it('resta compatibile con risposte V1 prive di requestId', () => {
    const guest = network.add('guest');
    network.flush();
    guest.inject(snapshot);
    expect(guest.state.synced).toBe(true);
    expect(guest.state.lifeByPlayerId).toEqual(snapshot.lifeByPlayerId);
  });

  it('verifica anche il mittente autenticato del messaggio', () => {
    const guest = network.add('guest');
    network.flush();
    guest.inject(snapshot, 'outsider');
    expect(guest.state.synced).toBe(false);
  });

  it.each(['', 'x'.repeat(121)])('rifiuta un requestId fuori dai limiti', (requestId) => {
    expect(parseMatchLifeCommand(encodeMatchLifeCommand({ ...snapshot, requestId }))).toBeNull();
  });

  it('trasporta gli UUID reali e la correlazione entro i 500 caratteri della chat', () => {
    const hostId = '019ff9f8-112d-73f0-9efe-a06d830360c6';
    const guestId = '019ff9f8-112d-73f0-9efe-a06d830360c7';
    const options = { authorityPlayerId: hostId, players: [
      { id: hostId, username: 'Host' }, { id: guestId, username: 'Guest' },
    ] as [Participant, Participant] };
    network.add(hostId, options);
    const guest = network.add(guestId, options);
    network.flush();
    expect(guest.state.synced).toBe(true);
    const encoded = encodeMatchLifeCommand({ ...snapshot,
      senderId: hostId, lifeByPlayerId: { [hostId]: 999, [guestId]: 999 },
      commandId: `${hostId}:1789050000000:100000`, requestId: `${guestId}:1789050000000:100000`,
    });
    expect(encoded.length).toBeLessThanOrEqual(500);
    expect(parseMatchLifeCommand(encoded)?.type).toBe('snapshot');
  });
});
