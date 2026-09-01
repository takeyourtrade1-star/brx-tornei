'use client';

import { useEffect, useState } from 'react';
import { synchronizedLocalTimestampMs } from '@/lib/synchronized-deadline';

interface SynchronizedCountdownOptions {
  active: boolean;
  deadline?: string;
  serverTime?: string;
}

export interface SynchronizedCountdownState {
  remaining: number | null;
  synchronized: boolean;
}

/** Countdown locale ancorato a due timestamp prodotti dallo stesso server. */
export function useSynchronizedCountdown({
  active,
  deadline,
  serverTime,
}: SynchronizedCountdownOptions): SynchronizedCountdownState {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [localDeadline, setLocalDeadline] = useState<number | null>(null);
  const [synchronized, setSynchronized] = useState(false);

  useEffect(() => {
    if (!active) {
      setRemaining(null);
      setLocalDeadline(null);
      setSynchronized(false);
      return;
    }

    const synchronizedDeadline = synchronizedLocalTimestampMs(deadline, serverTime);
    if (synchronizedDeadline === null) {
      setRemaining(null);
      setLocalDeadline(null);
      setSynchronized(false);
      return;
    }

    setRemaining(Math.max(0, Math.ceil((synchronizedDeadline - Date.now()) / 1_000)));
    setLocalDeadline(synchronizedDeadline);
    setSynchronized(true);
  }, [active, deadline, serverTime]);

  useEffect(() => {
    if (!active || localDeadline === null) return;
    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((localDeadline - Date.now()) / 1_000)));
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [active, localDeadline]);

  return { remaining, synchronized };
}
