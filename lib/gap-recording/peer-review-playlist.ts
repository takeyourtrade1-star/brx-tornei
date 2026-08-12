export interface GapPeerPlaylistState {
  recordingId: string;
  clipCount: number;
  currentIndex: number;
  failed: boolean;
  completed: boolean;
}

export type GapPeerPlaylistAction =
  | { type: 'ended' }
  | { type: 'failed' }
  | { type: 'retry' }
  | { type: 'reset'; recordingId: string; clipCount: number };

export function newGapPeerPlaylistState(
  recordingId: string,
  clipCount: number,
): GapPeerPlaylistState {
  return {
    recordingId,
    clipCount,
    currentIndex: 0,
    failed: false,
    completed: clipCount === 0,
  };
}

export function reduceGapPeerPlaylist(
  state: GapPeerPlaylistState,
  action: GapPeerPlaylistAction,
): GapPeerPlaylistState {
  if (action.type === 'reset') {
    return newGapPeerPlaylistState(action.recordingId, action.clipCount);
  }
  if (action.type === 'failed') return { ...state, failed: true };
  if (action.type === 'retry') return { ...state, failed: false, completed: false };
  if (state.failed || state.completed) return state;
  if (state.currentIndex + 1 >= state.clipCount) {
    return { ...state, completed: true };
  }
  return { ...state, currentIndex: state.currentIndex + 1 };
}

export function isGapViewTicketExpired(
  expiresAt: string,
  now = Date.now(),
  safetyWindowMs = 5_000,
): boolean {
  const expiry = Date.parse(expiresAt);
  return !Number.isFinite(expiry) || expiry <= now + safetyWindowMs;
}

export function restartGapPeerPlaylist(
  currentIndex: number,
  reset: () => void,
  replayCurrent: () => void,
): boolean {
  reset();
  if (currentIndex === 0) {
    replayCurrent();
    return false;
  }
  return true;
}
