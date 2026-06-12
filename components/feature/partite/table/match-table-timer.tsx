'use client';

import { useEffect, useState } from 'react';

/** Countdown demo verso la fine stimata della partita. */
export function MatchTableTimer({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState('—');

  useEffect(() => {
    function tick() {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('00:00');
        return;
      }
      const mins = Math.floor(diff / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      setRemaining(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  return <span className="font-mono font-bold tabular-nums">{remaining}</span>;
}
