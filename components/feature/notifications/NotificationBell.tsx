'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import {
  acknowledgeNotificationAction,
  fetchNotificationSnapshotAction,
  markNotificationReadAction,
} from '@/actions/notifications';
import {
  type NotificationSnapshot,
  notificationNeedsAcknowledgement,
  type TournamentNotification,
} from '@/types/notification';
import {
  copyFor,
  NotificationCopy,
  safeNotificationPath,
} from '@/components/feature/notifications/notification-copy';

interface NotificationBellProps {
  initialNotifications: NotificationSnapshot;
}

export function NotificationBell({ initialNotifications }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialNotifications.unread);
  const [items, setItems] = useState<TournamentNotification[]>(initialNotifications.items);
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialNotifications.items);
    setUnread(initialNotifications.unread);
    setError(false);
  }, [initialNotifications]);

  const toggleNotifications = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen) return;

    setRefreshing(true);
    const result = await fetchNotificationSnapshotAction();
    if (result.ok && result.snapshot.available) {
      setItems(result.snapshot.items);
      setUnread(result.snapshot.unread);
      setError(false);
    } else {
      setError(true);
    }
    setRefreshing(false);
  };

  const acknowledge = async (id: number) => {
    setAcknowledgingId(id);
    try {
      const result = await acknowledgeNotificationAction(id);
      if (!result.ok) {
        setError(true);
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
      setUnread((current) => Math.max(0, current - 1));
      setError(false);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const openNotification = async (notification: TournamentNotification) => {
    let close = true;
    if (!notificationNeedsAcknowledgement(notification) && !notification.read_at) {
      setUpdatingId(notification.id);
      try {
        const result = await markNotificationReadAction(notification.id);
        if (result.ok) {
          setItems((current) => current.filter((item) => item.id !== notification.id));
          setUnread((current) => Math.max(0, current - 1));
        } else {
          setError(true);
          close = false;
        }
      } finally {
        setUpdatingId(null);
      }
    }
    if (close) setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => void toggleNotifications()}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Notifiche"
        className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-primary transition hover:border-primary/40 hover:bg-primary/15"
      >
        <span className="relative">
          <Bell className="h-4 w-4" aria-hidden />
          {unread > 0 ? (
            <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-900/10 bg-white text-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-xs font-black uppercase tracking-[0.14em]">Notifiche</span>
            <div className="flex items-center gap-3">
              {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-label="Aggiornamento" /> : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Chiudi
              </button>
            </div>
          </div>
          {error ? (
            <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
              Non è stato possibile aggiornare la notifica. Riprova tra poco.
            </p>
          ) : null}
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
              <CheckCheck className="h-5 w-5 text-primary" aria-hidden />
              <p className="text-sm text-slate-600">Sei al passo con tutto.</p>
            </div>
          ) : (
            <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
              {items.map((notification) => {
                const copy = copyFor(notification);
                const pending = notificationNeedsAcknowledgement(notification);
                const href = safeNotificationPath(notification);
                const updating = updatingId === notification.id;
                return (
                  <li key={notification.id} className={pending ? 'bg-primary/[0.06]' : 'bg-white'}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={() => void openNotification(notification)}
                        className="block px-4 py-3 transition hover:bg-slate-50"
                      >
                        <NotificationCopy notification={notification} copy={copy} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void openNotification(notification)}
                        disabled={updating}
                        className="block w-full px-4 py-3 text-left transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        <NotificationCopy notification={notification} copy={copy} />
                      </button>
                    )}
                    {pending ? (
                      <div className="px-4 pb-3">
                        <button
                          type="button"
                          onClick={() => void acknowledge(notification.id)}
                          disabled={acknowledgingId === notification.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-header-bg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white transition hover:bg-header-bg/90 disabled:opacity-60"
                        >
                          {acknowledgingId === notification.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                          ) : null}
                          {acknowledgingId === notification.id ? 'Salvataggio…' : 'Ho compreso'}
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">
            Le decisioni di moderazione restano in evidenza finché non le confermi.
          </div>
        </div>
      ) : null}
    </div>
  );
}
