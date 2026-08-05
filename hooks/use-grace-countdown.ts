'use client';

import { useEffect, useState } from 'react';

/**
 * Secondi rimanenti fino a `deadlineIso`, o null se assente/scaduto. Ricalcola
 * ogni secondo — usato per il countdown di abbandono (90s, Requisiti 3+4).
 */
export function useGraceCountdown(deadlineIso?: string | null): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!deadlineIso) {
      setNow(null);
      return;
    }
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [deadlineIso]);

  if (!deadlineIso || now === null) return null;
  const deadline = Date.parse(deadlineIso);
  if (Number.isNaN(deadline)) return null;
  return Math.max(0, Math.ceil((deadline - now) / 1_000));
}
