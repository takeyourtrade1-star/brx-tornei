'use client';

import { useEffect, useMemo, useState } from 'react';
import { synchronizedLocalTimestampMs } from '@/lib/synchronized-deadline';

interface SynchronizedPhaseOptions {
  active: boolean;
  startsAt?: string;
  serverTime?: string;
}

/** Mostra una fase solo dall'istante condiviso prodotto dal server. */
export function useSynchronizedPhase({
  active,
  startsAt,
  serverTime,
}: SynchronizedPhaseOptions): { visible: boolean; synchronized: boolean } {
  const [now, setNow] = useState(() => Date.now());
  const localStart = useMemo(
    () => synchronizedLocalTimestampMs(startsAt, serverTime),
    [serverTime, startsAt],
  );

  useEffect(() => {
    if (!active || localStart === null) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [active, localStart]);

  const synchronized = active && localStart !== null;
  return { visible: synchronized && now >= localStart, synchronized };
}
