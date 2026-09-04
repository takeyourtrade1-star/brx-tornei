import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ saveAssoWorldLookAction: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/actions/asso-world-look', () => ({
  saveAssoWorldLookAction: mocks.saveAssoWorldLookAction,
}));

import type { AssoWorldLookActionState } from '@/actions/asso-world-look';
import type { AssoWorldLook } from '@/types/asso-world';
import {
  createWorldLookSaveCoordinator,
  mergeWorldLookPatch,
} from '../../minigioco-test/world-runtime/use-world-look';

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

async function flush(): Promise<void> {
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
}

const INITIAL = { hair: 'm3', outfit: 'tank' } as const satisfies AssoWorldLook;
const LOOK_A = { hair: 'f1', outfit: 'hoodie' } as const satisfies AssoWorldLook;
const LOOK_B = { hair: 'm1', outfit: 'jacket' } as const satisfies AssoWorldLook;
const LOOK_C = { hair: 'f3', outfit: 'jersey' } as const satisfies AssoWorldLook;

function saveQueue() {
  const calls: AssoWorldLook[] = [];
  const pending: Array<Deferred<AssoWorldLookActionState>> = [];
  const save = (look: AssoWorldLook): Promise<AssoWorldLookActionState> => {
    calls.push({ ...look });
    const request = deferred<AssoWorldLookActionState>();
    pending.push(request);
    return request.promise;
  };
  return { calls, pending, save };
}

describe('runtime salvataggio look Asso World', () => {
  it('mantiene il merge parziale nel formato canonico', () => {
    expect(mergeWorldLookPatch(INITIAL, { hair: 'f2' })).toEqual({
      hair: 'f2',
      outfit: 'tank',
    });
    expect(mergeWorldLookPatch(INITIAL, { outfit: 'jersey' })).toEqual({
      hair: 'm3',
      outfit: 'jersey',
    });
  });

  it('serializza e coalesca le modifiche mantenendo solo l ultimo draft', async () => {
    const queue = saveQueue();
    const coordinator = createWorldLookSaveCoordinator({
      initialLook: 'look:m3:tank',
      saveAction: queue.save,
    });

    coordinator.submit(LOOK_A);
    coordinator.submit(LOOK_B);
    coordinator.submit(LOOK_C);
    await flush();
    expect(queue.calls).toEqual([LOOK_A]);
    expect(coordinator.getState()).toMatchObject({ draft: LOOK_C, saved: INITIAL, pending: true });

    queue.pending[0].resolve({ ok: true, data: LOOK_A });
    await flush();
    expect(queue.calls).toEqual([LOOK_A, LOOK_C]);
    queue.pending[1].resolve({ ok: true, data: LOOK_C });
    await flush();
    expect(coordinator.getState()).toEqual({
      draft: LOOK_C,
      saved: LOOK_C,
      pending: false,
      error: null,
    });
  });

  it('fa fallire l ultimo salvataggio sul look appena confermato', async () => {
    const queue = saveQueue();
    const coordinator = createWorldLookSaveCoordinator({ initialLook: INITIAL, saveAction: queue.save });
    coordinator.submit(LOOK_A);
    await flush();
    coordinator.submit(LOOK_B);

    queue.pending[0].resolve({ ok: true, data: LOOK_A });
    await flush();
    expect(queue.calls).toEqual([LOOK_A, LOOK_B]);
    queue.pending[1].resolve({ ok: false, error: 'Servizio non disponibile.' });
    await flush();

    expect(coordinator.getState()).toEqual({
      draft: LOOK_A,
      saved: LOOK_A,
      pending: false,
      error: 'Servizio non disponibile.',
    });
  });

  it('rifiuta una risposta action corrotta invece di trasformarla nel default', async () => {
    const coordinator = createWorldLookSaveCoordinator({
      initialLook: INITIAL,
      saveAction: async () => ({
        ok: true,
        data: 'look:f2:hoodie',
      } as unknown as AssoWorldLookActionState),
    });
    coordinator.submit(LOOK_A);
    await flush();

    expect(coordinator.getState()).toMatchObject({
      draft: INITIAL,
      saved: INITIAL,
      pending: false,
      error: 'Risposta personalizzazione non valida.',
    });
  });

  it('drena solo l ultimo intento dopo dispose senza notificare il componente', async () => {
    const queue = saveQueue();
    const coordinator = createWorldLookSaveCoordinator({ initialLook: INITIAL, saveAction: queue.save });
    const updates: unknown[] = [];
    coordinator.subscribe((state) => updates.push(state));
    coordinator.submit(LOOK_A);
    await flush();
    coordinator.submit(LOOK_B);
    coordinator.submit(LOOK_C);
    const updatesBeforeDispose = updates.length;
    coordinator.dispose();

    queue.pending[0].resolve({ ok: true, data: LOOK_A });
    await flush();
    expect(queue.calls).toEqual([LOOK_A, LOOK_C]);
    queue.pending[1].resolve({ ok: true, data: LOOK_C });
    await flush();

    expect(updates).toHaveLength(updatesBeforeDispose);
    expect(coordinator.getState()).toMatchObject({ draft: LOOK_C, saved: LOOK_C, pending: false });
  });

  it('isola la coda tra due istanze e permette il retry dell ultimo errore', async () => {
    const first = saveQueue();
    const second = saveQueue();
    const one = createWorldLookSaveCoordinator({ initialLook: INITIAL, saveAction: first.save });
    const two = createWorldLookSaveCoordinator({ initialLook: INITIAL, saveAction: second.save });
    one.submit(LOOK_A);
    two.submit(LOOK_B);
    await flush();
    expect(first.calls).toEqual([LOOK_A]);
    expect(second.calls).toEqual([LOOK_B]);

    first.pending[0].reject(new Error('offline'));
    await flush();
    expect(one.retry()).toBe(true);
    await flush();
    expect(first.calls).toEqual([LOOK_A, LOOK_A]);
    first.pending[1].resolve({ ok: true, data: LOOK_A });
    await flush();
    expect(one.getState()).toMatchObject({ draft: LOOK_A, saved: LOOK_A, pending: false, error: null });
  });
});
