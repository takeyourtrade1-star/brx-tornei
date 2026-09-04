import type { AssoWorldLookActionState } from '@/actions/asso-world-look';
import type { AssoWorldLook } from '@/types/asso-world';

export type WorldLookPatch = Partial<Pick<AssoWorldLook, 'hair' | 'outfit'>>;
export type WorldLookSaveAction = (
  look: AssoWorldLook,
) => Promise<AssoWorldLookActionState>;

export interface WorldLookState {
  readonly draft: AssoWorldLook;
  readonly saved: AssoWorldLook;
  readonly pending: boolean;
  readonly error: string | null;
}

export interface WorldLookSaveCoordinatorOptions {
  readonly initialLook?: unknown;
  readonly saveAction?: WorldLookSaveAction;
}

export interface WorldLookSaveCoordinator {
  readonly getState: () => WorldLookState;
  readonly submit: (value: unknown) => AssoWorldLook;
  readonly retry: () => boolean;
  readonly reset: () => AssoWorldLook;
  readonly subscribe: (listener: (state: WorldLookState) => void) => () => void;
  readonly dispose: () => void;
}
