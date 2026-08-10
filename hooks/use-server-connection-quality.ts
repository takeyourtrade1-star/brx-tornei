'use client';

import { useEffect, useState } from 'react';
import { reportConnectionQualityAction } from '@/actions/matches';
import { classifyConnectionQuality } from '@/lib/webrtc/connection-quality';
import type { ConnectionQuality } from '@/types/tournament';

const SAMPLE_INTERVAL_MS = 15_000;

interface BrowserNetworkInformation {
  effectiveType?: string;
}

function networkInformation(): BrowserNetworkInformation | undefined {
  return (navigator as Navigator & { connection?: BrowserNetworkInformation }).connection;
}

async function probeServer(): Promise<ConnectionQuality> {
  const samples: number[] = [];
  for (let index = 0; index < 2; index += 1) {
    const started = performance.now();
    const response = await fetch('/api/tournaments/connection-probe', {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok && response.status !== 204) throw new Error('probe failed');
    samples.push(performance.now() - started);
  }
  const rttMs = Math.round(Math.min(...samples));
  const effectiveType = networkInformation()?.effectiveType;
  return {
    level: classifyConnectionQuality({
      rttMs,
      effectiveType,
      online: navigator.onLine,
      transport: 'server',
    }),
    rttMs,
    transport: 'server',
    checkedAt: new Date().toISOString(),
  };
}

/** Misura client-side necessaria: la latenza dell'utente non è osservabile da un RSC. */
export function useServerConnectionQuality(sessionId?: string | null): ConnectionQuality | undefined {
  const [quality, setQuality] = useState<ConnectionQuality>();

  useEffect(() => {
    if (!sessionId) {
      setQuality(undefined);
      return;
    }
    let cancelled = false;
    const sample = async () => {
      let next: ConnectionQuality;
      try {
        next = await probeServer();
      } catch {
        next = {
          level: 'poor',
          transport: 'server',
          checkedAt: new Date().toISOString(),
        };
      }
      if (cancelled) return;
      setQuality(next);
      void reportConnectionQualityAction(sessionId, {
        level: next.level,
        rttMs: next.rttMs,
        transport: next.transport,
      });
    };
    void sample();
    const interval = window.setInterval(() => void sample(), SAMPLE_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sessionId]);

  return quality;
}
