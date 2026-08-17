'use client';

import { useEffect, useRef, useState } from 'react';
import { synchronizedRemainingMs } from '@/lib/synchronized-deadline';

interface SynchronizedCountdownOptions {
  active: boolean;
  deadline?: string;
  serverTime?: string;
  fallbackSeconds: number;
}

/** Countdown locale ancorato a due timestamp prodotti dallo stesso server. */
export function useSynchronizedCountdown({
  active,
  deadline,
  serverTime,
  fallbackSeconds,
}: SynchronizedCountdownOptions): number {
  const [remaining, setRemaining] = useState(fallbackSeconds);
  const [localDeadline, setLocalDeadline] = useState(
    () => Date.now() + fallbackSeconds * 1_000,
  );
  const wasActive = useRef(false);

  useEffect(() => {
    const entered = active && !wasActive.current;
    wasActive.current = active;
    if (!active) return;

    const synchronized = synchronizedRemainingMs(deadline, serverTime);
    if (synchronized !== null) {
      setRemaining(Math.ceil(synchronized / 1_000));
      setLocalDeadline(Date.now() + synchronized);
    } else if (entered) {
      setRemaining(fallbackSeconds);
      setLocalDeadline(Date.now() + fallbackSeconds * 1_000);
    }
  }, [active, deadline, fallbackSeconds, serverTime]);

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((localDeadline - Date.now()) / 1_000)));
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [active, localDeadline]);

  return remaining;
}
