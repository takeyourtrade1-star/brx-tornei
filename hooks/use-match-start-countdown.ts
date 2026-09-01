'use client';

import { useEffect, useMemo, useState } from 'react';
import { synchronizedLocalTimestampMs } from '@/lib/synchronized-deadline';

interface UseMatchStartCountdownOptions {
  active: boolean;
  authoritativeStartsAt?: string;
  serverTime?: string;
}

/**
 * Traduce l'istante di avvio del Tournament Service nella timeline locale.
 * Non usa chat, localStorage o il momento di mount: quei riferimenti possono
 * differire tra i due browser e produrre intro e timer sfalsati.
 */
export function useMatchStartCountdown({
  active,
  authoritativeStartsAt,
  serverTime,
}: UseMatchStartCountdownOptions) {
  const [startsAtLocalMs, setStartsAtLocalMs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const synchronizedStart = useMemo(
    () => synchronizedLocalTimestampMs(authoritativeStartsAt, serverTime),
    [authoritativeStartsAt, serverTime],
  );

  useEffect(() => {
    setStartsAtLocalMs(active ? synchronizedStart : null);
    setNow(Date.now());
  }, [active, synchronizedStart]);

  useEffect(() => {
    if (!active || startsAtLocalMs === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [active, startsAtLocalMs]);

  const remainingSeconds = useMemo(() => {
    if (!active || startsAtLocalMs === null) return null;
    return Math.max(0, Math.ceil((startsAtLocalMs - now) / 1_000));
  }, [active, now, startsAtLocalMs]);

  return {
    remainingSeconds,
    startsAtLocalMs,
    synchronized: startsAtLocalMs !== null,
    readyToPlay: active && startsAtLocalMs !== null && remainingSeconds === 0,
  };
}
