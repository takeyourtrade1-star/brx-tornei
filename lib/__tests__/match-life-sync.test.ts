import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react-test-renderer';
import { LifeNetwork } from './helpers/match-life-harness';

let network: LifeNetwork;
function advance(ms: number) { act(() => { vi.advanceTimersByTime(ms); }); network.flush(); }

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', {});
  network = new LifeNetwork();
});
afterEach(() => { network.dispose(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('sincronizzazione punti vita con due giocatori', () => {
  it.each(['host', 'guest'])('sblocca entrambi se entra prima %s', (first) => {
    const one = network.add(first);
    network.flush();
    const two = network.add(first === 'host' ? 'guest' : 'host');
    network.flush();
    advance(1_000);
    for (const peer of [one, two]) {
      expect(peer.state.synced).toBe(true);
      peer.run(() => expect(peer.state.changeLife(peer.options.userId, -1)).toBe(true));
      network.flush();
    }
    expect(one.state.lifeByPlayerId).toEqual({ host: 19, guest: 19 });
    expect(two.state.lifeByPlayerId).toEqual(one.state.lifeByPlayerId);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['sync-request', 'snapshot'])('recupera la perdita del primo %s', (type) => {
    let dropped = false;
    network.drop = (command) => {
      if (command.type === type && !dropped) { dropped = true; return true; }
      return false;
    };
    network.add('host');
    const guest = network.add('guest');
    network.flush();
    expect(guest.state.synced).toBe(false);
    guest.run(() => {
      expect(guest.state.changeLife('guest', -1)).toBe(false);
      expect(guest.state.resetLife()).toBe(false);
    });
    advance(1_000);
    expect(guest.state.synced).toBe(true);
    expect(guest.requests).toHaveLength(2);
    expect(guest.requests[0].commandId).not.toBe(guest.requests[1].commandId);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('continua con backoff massimo di cinque secondi e recupera un invio fallito', () => {
    const guest = network.add('guest');
    network.flush();
    guest.failSend = true;
    advance(1_000);
    expect(guest.state.synced).toBe(false);
    guest.failSend = false;
    advance(2_000);
    advance(4_000);
    expect(guest.requests).toHaveLength(3);
    advance(4_999);
    expect(guest.requests).toHaveLength(3);
    advance(1);
    expect(guest.requests).toHaveLength(4);
    advance(5_000);
    expect(guest.requests).toHaveLength(5);
    network.add('host');
    advance(5_000);
    expect(guest.state.synced).toBe(true);
  });

  it('richiede uno stato nuovo dopo la riconnessione e annulla il timer offline', () => {
    const host = network.add('host');
    const guest = network.add('guest');
    network.flush();
    guest.update({ connected: false });
    expect(guest.state.synced).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    host.run(() => { host.state.changeLife('host', -5); });
    network.flush();
    advance(20_000);
    expect(guest.requests).toHaveLength(1);
    guest.update({ connected: true });
    network.flush();
    expect(guest.requests).toHaveLength(2);
    expect(guest.state.synced).toBe(true);
    expect(guest.state.lifeByPlayerId.host).toBe(15);
  });

  it('resta bloccato se fallisce il primo invio e sospende i tentativi offline', () => {
    const guest = network.add('guest', { connected: false });
    guest.failSend = true;
    guest.update({ connected: true });
    expect(guest.requests).toHaveLength(0);
    expect(guest.state.synced).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    guest.update({ connected: false });
    expect(vi.getTimerCount()).toBe(0);
    advance(20_000);
    guest.failSend = false;
    network.add('host');
    guest.update({ connected: true });
    network.flush();
    expect(guest.state.synced).toBe(true);
  });

  it('annulla i tentativi uscendo e non riutilizza risposte della partita precedente', () => {
    const guest = network.add('guest');
    network.flush();
    const oldRequest = guest.requests[0].commandId;
    guest.update({ matchId: 'match-2', messages: [] });
    network.flush();
    expect(vi.getTimerCount()).toBe(1);
    guest.inject({ type: 'snapshot', senderId: 'host', requestId: oldRequest,
      startingLife: 20, lifeByPlayerId: { host: 1, guest: 1 }, revision: 0 });
    expect(guest.state.synced).toBe(false);
    expect(guest.state.lifeByPlayerId).toEqual({ host: 20, guest: 20 });
    guest.unmount();
    const count = guest.requests.length;
    advance(30_000);
    expect(guest.requests).toHaveLength(count);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('limita ogni giocatore alle proprie vite e deduplica i messaggi', () => {
    const host = network.add('host');
    const guest = network.add('guest');
    network.flush();
    guest.run(() => {
      expect(guest.state.changeLife('host', -5)).toBe(false);
      expect(guest.state.setStartingLife(40)).toBe(false);
      expect(guest.state.changeLife('guest', -5)).toBe(true);
    });
    network.flush();
    const delta = guest.sent.find((command) => command.type === 'delta')!;
    host.inject(delta);
    guest.inject(delta);
    expect(host.state.lifeByPlayerId).toEqual({ host: 20, guest: 15 });
    expect(guest.state.lifeByPlayerId).toEqual(host.state.lifeByPlayerId);
    guest.run(() => expect(guest.state.resetLife()).toBe(true));
    network.flush();
    expect(host.state.lifeByPlayerId.guest).toBe(20);
  });
});
