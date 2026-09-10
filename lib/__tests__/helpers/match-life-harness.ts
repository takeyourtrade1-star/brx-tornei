import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useMatchLife } from '@/hooks/use-match-life';
import type { MatchChatMessage } from '@/hooks/use-match-chat';
import { encodeMatchLifeCommand, parseMatchLifeCommand, type MatchLifeCommand } from '@/lib/match-life-protocol';

type Options = Parameters<typeof useMatchLife>[0];
let messageId = 0;

function LifeProbe({ peer }: { peer: LifePeer }) {
  peer.state = useMatchLife(peer.options);
  return null;
}

/** Due componenti React reali; il trasporto simulato può perdere singoli messaggi. */
export class LifeNetwork {
  peers: LifePeer[] = [];
  queue: { peer: LifePeer; message: MatchChatMessage }[] = [];
  drop: (command: MatchLifeCommand, sender: LifePeer, receiver: LifePeer) => boolean = () => false;

  add(userId: string, overrides: Partial<Options> = {}) {
    const peer = new LifePeer(this, userId, overrides);
    this.peers.push(peer);
    return peer;
  }

  flush() {
    let count = 0;
    while (this.queue.length) {
      if (++count > 200) throw new Error('Ciclo inatteso nella sincronizzazione');
      const { peer, message } = this.queue.shift()!;
      if (peer.mounted && peer.options.connected) peer.receive(message);
    }
  }

  dispose() { for (const peer of this.peers) peer.unmount(); }
}

export class LifePeer {
  options: Options;
  state!: ReturnType<typeof useMatchLife>;
  sent: MatchLifeCommand[] = [];
  mounted = true;
  failSend = false;
  private renderer: ReactTestRenderer;
  private storage = new Map<string, string>();

  constructor(private network: LifeNetwork, userId: string, overrides: Partial<Options>) {
    this.options = {
      matchId: 'match-1', userId, authorityPlayerId: 'host', connected: true, messages: [],
      players: [{ id: 'host', username: 'Host' }, { id: 'guest', username: 'Guest' }],
      send: (text) => this.send(text), ...overrides,
    };
    let renderer!: ReactTestRenderer;
    this.run(() => { renderer = create(createElement(LifeProbe, { peer: this })); });
    this.renderer = renderer;
  }

  run(operation: () => void) {
    Object.assign(window, { sessionStorage: {
      getItem: (key: string) => this.storage.get(key) ?? null,
      setItem: (key: string, value: string) => { this.storage.set(key, value); },
    } });
    act(operation);
  }

  update(overrides: Partial<Options>) {
    this.options = { ...this.options, ...overrides };
    this.run(() => this.renderer.update(createElement(LifeProbe, { peer: this })));
  }

  receive(message: MatchChatMessage) {
    this.update({ messages: [...this.options.messages, message] });
  }

  inject(command: MatchLifeCommand, userId = command.senderId) {
    this.receive({ id: `message-${++messageId}`, userId, text: encodeMatchLifeCommand(command), sentAt: Date.now() });
  }

  private send(text: string) {
    if (this.failSend || !this.options.connected) return false;
    // Stesso limite applicato dalla chat reale.
    const command = parseMatchLifeCommand(text.trim().slice(0, 500));
    if (!command) throw new Error('Comando non valido o troncato dal trasporto');
    this.sent.push(command);
    const message = { id: `message-${++messageId}`, userId: this.options.userId, text, sentAt: Date.now() };
    this.network.queue.push({ peer: this, message });
    for (const peer of this.network.peers) {
      if (peer !== this && peer.mounted && peer.options.connected &&
          peer.options.matchId === this.options.matchId && !this.network.drop(command, this, peer)) {
        this.network.queue.push({ peer, message });
      }
    }
    return true;
  }

  get requests() { return this.sent.filter((command) => command.type === 'sync-request'); }

  unmount() {
    if (!this.mounted) return;
    this.run(() => this.renderer.unmount());
    this.mounted = false;
  }
}
