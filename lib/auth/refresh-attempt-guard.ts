const REFRESH_ATTEMPT_KEY = 'ebartex-auth-refresh-attempt-v1';
const UNCERTAIN_MARKER = 'uncertain';

let memoryBlocked = false;

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Blocks reuse after a refresh whose response may have been lost. */
export function hasUncertainAuthRefreshAttempt(): boolean {
  try {
    if (browserStorage()?.getItem(REFRESH_ATTEMPT_KEY) === UNCERTAIN_MARKER) {
      return true;
    }
  } catch {
    // The module marker remains the safe same-tab fallback.
  }
  return memoryBlocked;
}

export function markAuthRefreshAttemptUncertain(): void {
  memoryBlocked = true;
  try {
    browserStorage()?.setItem(REFRESH_ATTEMPT_KEY, UNCERTAIN_MARKER);
  } catch {
    // Web Locks still serialize concurrent calls; memory blocks this tab.
  }
}

export function clearUncertainAuthRefreshAttempt(): void {
  memoryBlocked = false;
  try {
    browserStorage()?.removeItem(REFRESH_ATTEMPT_KEY);
  } catch {
    // A persistent marker that cannot be removed fails closed.
  }
}
