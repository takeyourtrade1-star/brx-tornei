'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createWorldLookSaveCoordinator,
  mergeWorldLookPatch,
} from './world-look-save-coordinator';
import type {
  WorldLookPatch,
  WorldLookSaveAction,
  WorldLookSaveCoordinator,
  WorldLookSaveCoordinatorOptions,
  WorldLookState,
} from './world-look-types';
import { saveAssoWorldLookAction } from '@/actions/asso-world-look';
import { parseAssoWorldLook } from '@/lib/asso-world-look';
import type { AssoWorldLook } from '@/types/asso-world';

export {
  createWorldLookSaveCoordinator,
  mergeWorldLookPatch,
} from './world-look-save-coordinator';
export type {
  WorldLookPatch,
  WorldLookSaveAction,
  WorldLookSaveCoordinator,
  WorldLookSaveCoordinatorOptions,
  WorldLookState,
} from './world-look-types';

export type UseWorldLookOptions = WorldLookSaveCoordinatorOptions & {
  readonly onPreview?: (look: AssoWorldLook) => void;
};

export interface UseWorldLookResult extends WorldLookState {
  readonly look: AssoWorldLook;
  readonly syncedLook: AssoWorldLook;
  readonly updateLook: (patch: WorldLookPatch) => AssoWorldLook;
  readonly setLook: (value: unknown) => AssoWorldLook;
  readonly retryLookSave: () => boolean;
  readonly applyLook: (patch: WorldLookPatch) => AssoWorldLook;
  readonly retrySave: () => boolean;
  readonly resetLook: () => AssoWorldLook;
}

/** Hook client: il parent collega `onPreview` a `gameRef.current.setLook`. */
export function useWorldLook(
  options: UseWorldLookOptions = {},
): UseWorldLookResult {
  const initialLook = useMemo(
    () => parseAssoWorldLook(options.initialLook),
    [options.initialLook],
  );
  const saveActionRef = useRef<WorldLookSaveAction | undefined>(options.saveAction);
  saveActionRef.current = options.saveAction;
  const previewRef = useRef<UseWorldLookOptions['onPreview']>(options.onPreview);
  previewRef.current = options.onPreview;
  const coordinatorRef = useRef<WorldLookSaveCoordinator | null>(null);
  if (!coordinatorRef.current) {
    coordinatorRef.current = createWorldLookSaveCoordinator({
      initialLook,
      saveAction: (look) => (
        saveActionRef.current?.(look) ?? saveAssoWorldLookAction(look)
      ),
    });
  }
  const coordinator = coordinatorRef.current;
  const [state, setState] = useState<WorldLookState>(() => coordinator.getState());
  const draftRef = useRef(state.draft);
  draftRef.current = state.draft;

  useEffect(() => {
    const unsubscribe = coordinator.subscribe(setState);
    setState(coordinator.getState());
    return () => {
      unsubscribe();
      coordinator.dispose();
    };
  }, [coordinator]);

  useEffect(() => {
    previewRef.current?.(state.draft);
  }, [state.draft]);

  const applyLook = useCallback((patch: WorldLookPatch): AssoWorldLook => {
    const next = mergeWorldLookPatch(draftRef.current, patch);
    draftRef.current = next;
    return coordinator.submit(next);
  }, [coordinator]);
  const setLook = useCallback((value: unknown): AssoWorldLook => {
    const next = parseAssoWorldLook(value);
    draftRef.current = next;
    return coordinator.submit(next);
  }, [coordinator]);
  const retrySave = useCallback((): boolean => {
    const retried = coordinator.retry();
    draftRef.current = coordinator.getState().draft;
    return retried;
  }, [coordinator]);
  const resetLook = useCallback((): AssoWorldLook => {
    const next = coordinator.reset();
    draftRef.current = next;
    return next;
  }, [coordinator]);

  return {
    ...state,
    look: state.draft,
    syncedLook: state.saved,
    updateLook: applyLook,
    setLook,
    retryLookSave: retrySave,
    applyLook,
    retrySave,
    resetLook,
  };
}
