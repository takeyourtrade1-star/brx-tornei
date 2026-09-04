'use client';

import {
  saveAssoWorldLookAction,
} from '@/actions/asso-world-look';
import { isAssoWorldLook, parseAssoWorldLook } from '@/lib/asso-world-look';
import type { AssoWorldLook } from '@/types/asso-world';
import type {
  WorldLookPatch,
  WorldLookSaveAction,
  WorldLookSaveCoordinator,
  WorldLookSaveCoordinatorOptions,
  WorldLookState,
} from './world-look-types';

export type {
  WorldLookPatch,
  WorldLookSaveAction,
  WorldLookSaveCoordinator,
  WorldLookSaveCoordinatorOptions,
  WorldLookState,
} from './world-look-types';

function cloneLook(value: AssoWorldLook): AssoWorldLook {
  return { hair: value.hair, outfit: value.outfit };
}

function sameLook(left: AssoWorldLook, right: AssoWorldLook): boolean {
  return left.hair === right.hair && left.outfit === right.outfit;
}

function errorText(value: unknown): string {
  return value instanceof Error && value.message.trim()
    ? value.message
    : 'Personalizzazione non salvata.';
}

function readActionResult(value: unknown):
  | { readonly ok: true; readonly data: AssoWorldLook }
  | { readonly ok: false; readonly error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Personalizzazione non salvata.' };
  }
  const record = value as Record<string, unknown>;
  if (record.ok !== true || !('data' in record) || record.data === undefined) {
    return {
      ok: false,
      error: typeof record.error === 'string' && record.error.trim()
        ? record.error
        : 'Personalizzazione non salvata.',
    };
  }
  if (!isAssoWorldLook(record.data)) {
    return { ok: false, error: 'Risposta personalizzazione non valida.' };
  }
  return { ok: true, data: cloneLook(record.data) };
}

function snapshot(state: WorldLookState): WorldLookState {
  return {
    draft: cloneLook(state.draft),
    saved: cloneLook(state.saved),
    pending: state.pending,
    error: state.error,
  };
}

/** Unisce un cambio della modale usando il parser canonico del look. */
export function mergeWorldLookPatch(
  base: AssoWorldLook,
  patch: WorldLookPatch,
): AssoWorldLook {
  return parseAssoWorldLook({
    hair: patch.hair ?? base.hair,
    outfit: patch.outfit ?? base.outfit,
  });
}

/** Coda seriale: una action attiva e solo l'ultimo valore ancora da inviare. */
export function createWorldLookSaveCoordinator(
  options: WorldLookSaveCoordinatorOptions = {},
): WorldLookSaveCoordinator {
  const save = options.saveAction ?? saveAssoWorldLookAction;
  const initial = cloneLook(parseAssoWorldLook(options.initialLook));
  let state: WorldLookState = { draft: initial, saved: initial, pending: false, error: null };
  let active: { readonly id: number; readonly value: AssoWorldLook } | null = null;
  let queued: AssoWorldLook | null = null;
  let failed: AssoWorldLook | null = null;
  let nextId = 0;
  let detached = false;
  let closed = false;
  const listeners = new Set<(next: WorldLookState) => void>();

  function emit(): void {
    if (closed || detached) return;
    const next = snapshot(state);
    for (const listener of [...listeners]) listener(next);
  }

  function begin(value: AssoWorldLook): void {
    if (closed) return;
    const request = { id: ++nextId, value: cloneLook(value) };
    active = request;
    state = { ...state, pending: true, error: null };
    emit();
    void Promise.resolve()
      .then(() => save(cloneLook(request.value)))
      .then(
        (result) => finish(request, readActionResult(result)),
        (error: unknown) => finish(request, { ok: false, error: errorText(error) }),
      );
  }

  function finish(
    request: { readonly id: number; readonly value: AssoWorldLook },
    result:
      | { readonly ok: true; readonly data: AssoWorldLook }
      | { readonly ok: false; readonly error: string },
  ): void {
    if (closed || active?.id !== request.id) return;
    active = null;
    if (result.ok) {
      const saved = cloneLook(result.data);
      state = { ...state, saved, error: null };
      failed = null;
      const next = queued;
      queued = null;
      if (next && !sameLook(next, saved)) {
        begin(next);
        return;
      }
      state = { ...state, draft: saved, pending: false, error: null };
      if (detached) {
        closed = true;
        return;
      }
      emit();
      return;
    }

    const next = queued;
    queued = null;
    if (next && !sameLook(next, state.saved)) {
      begin(next);
      return;
    }
    failed = next ? null : cloneLook(request.value);
    state = {
      ...state,
      draft: cloneLook(state.saved),
      pending: false,
      error: next ? null : result.error,
    };
    if (detached) {
      closed = true;
      return;
    }
    emit();
  }

  function submit(value: unknown): AssoWorldLook {
    const next = cloneLook(parseAssoWorldLook(value));
    if (closed || detached) return next;
    failed = null;
    state = { ...state, draft: next, error: null };
    if (active) {
      queued = sameLook(next, active.value) ? null : next;
      state = { ...state, pending: true };
      emit();
      return next;
    }
    queued = null;
    if (sameLook(next, state.saved)) {
      state = { ...state, pending: false, error: null };
      emit();
      return next;
    }
    begin(next);
    return next;
  }

  function retry(): boolean {
    if (closed || detached || active || queued || !failed) return false;
    const next = cloneLook(failed);
    failed = null;
    state = { ...state, draft: next, pending: true, error: null };
    begin(next);
    return true;
  }

  function reset(): AssoWorldLook {
    const next = cloneLook(state.saved);
    if (closed || detached) return next;
    failed = null;
    state = { ...state, draft: next, error: null };
    if (active) {
      queued = sameLook(next, active.value) ? null : next;
      state = { ...state, pending: true };
    } else {
      queued = null;
      state = { ...state, pending: false };
    }
    emit();
    return next;
  }

  function subscribe(listener: (next: WorldLookState) => void): () => void {
    if (closed) return () => undefined;
    detached = false;
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function dispose(): void {
    if (closed || detached) return;
    detached = true;
    listeners.clear();
    // Consente il doppio setup degli effetti in React Strict Mode. Se una
    // richiesta è attiva, `finish` drena anche l'ultimo valore accodato.
    Promise.resolve().then(() => {
      if (!detached || listeners.size > 0 || active) return;
      closed = true;
      queued = null;
    });
  }

  return { getState: () => snapshot(state), submit, retry, reset, subscribe, dispose };
}
