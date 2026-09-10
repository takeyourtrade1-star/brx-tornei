'use client';

import { useEffect, useState } from 'react';
import { getSocialPreferencesAction } from '@/actions/social-preferences';
import {
  SOCIAL_DND_CHANGED_EVENT,
  type SocialDndChangedDetail,
} from '@/lib/social-dnd-event';

const CLOCK_REFRESH_MS = 30_000;

export interface SocialDndReminderState {
  active: boolean;
  minutesRemaining: number;
}

function activeDndUntil(value: unknown, now = Date.now()): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > now
    ? value
    : null;
}

/** Legge il DND persistito e mantiene il promemoria allineato alla scadenza. */
export function useSocialDndReminder(): SocialDndReminderState {
  const [dndUntil, setDndUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    let eventRevision = 0;

    const handleDndChange = (event: Event) => {
      const detail = (event as CustomEvent<SocialDndChangedDetail>).detail;
      if (
        !detail ||
        (detail.dndUntil !== null &&
          (typeof detail.dndUntil !== 'number' || !Number.isFinite(detail.dndUntil)))
      ) {
        return;
      }

      eventRevision += 1;
      setDndUntil(activeDndUntil(detail.dndUntil));
      setNow(Date.now());
    };

    window.addEventListener(SOCIAL_DND_CHANGED_EVENT, handleDndChange);
    void getSocialPreferencesAction().then((result) => {
      if (cancelled || eventRevision > 0) return;
      setDndUntil(activeDndUntil(result.ok ? result.data?.dndUntil : null));
      setNow(Date.now());
    });

    return () => {
      cancelled = true;
      window.removeEventListener(SOCIAL_DND_CHANGED_EVENT, handleDndChange);
    };
  }, []);

  useEffect(() => {
    if (dndUntil === null) return;

    const refreshClock = () => setNow(Date.now());
    const interval = window.setInterval(refreshClock, CLOCK_REFRESH_MS);
    const timeout = window.setTimeout(() => {
      setDndUntil(null);
      refreshClock();
    }, Math.max(0, dndUntil - Date.now()));

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [dndUntil]);

  const active = dndUntil !== null && dndUntil > now;
  return {
    active,
    minutesRemaining: active && dndUntil
      ? Math.max(1, Math.ceil((dndUntil - now) / 60_000))
      : 0,
  };
}
