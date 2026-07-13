type Timer = ReturnType<typeof setTimeout>;

/** Gestisce i timeout indipendenti usati durante il ciclo di vita WebRTC. */
export function createPeerWatchdogs<Key extends string>() {
  const timers = new Map<Key, Timer>();

  const clear = (key: Key) => {
    const timer = timers.get(key);
    if (!timer) return;
    clearTimeout(timer);
    timers.delete(key);
  };

  const arm = (key: Key, callback: () => void, delay: number) => {
    clear(key);
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        callback();
      }, delay),
    );
  };

  const clearAll = () => {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  };

  return { arm, clear, clearAll };
}
