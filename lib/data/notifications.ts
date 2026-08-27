import 'server-only';

import { cache } from 'react';
import { config } from '@/lib/config';
import { getAccessToken } from '@/lib/auth/session';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';
import type {
  NotificationSnapshot,
  TournamentNotification,
} from '@/types/notification';

const MAX_RESPONSE_BYTES = 1 * 1024 * 1024;
const NOTIFICATION_LIMIT = 20;

export class NotificationApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'NotificationApiError';
    this.status = status;
  }
}

const EMPTY_SNAPSHOT: NotificationSnapshot = { items: [], unread: 0, available: false };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function mapNotification(value: unknown): TournamentNotification | null {
  const raw = asRecord(value);
  const id = raw?.id;
  const type = raw?.type;
  const title = raw?.title;
  const body = raw?.body;
  const createdAt = raw?.created_at;
  if (
    !raw ||
    typeof id !== 'number' ||
    !Number.isSafeInteger(id) ||
    id < 1 ||
    typeof type !== 'string' ||
    typeof title !== 'string' ||
    typeof body !== 'string' ||
    typeof createdAt !== 'string' ||
    !Number.isFinite(Date.parse(createdAt))
  ) {
    return null;
  }

  const payload = asRecord(raw.payload);
  return {
    id,
    type,
    title,
    body,
    related_kind: optionalString(raw.related_kind),
    related_id:
      typeof raw.related_id === 'number' && Number.isSafeInteger(raw.related_id)
        ? raw.related_id
        : null,
    payload,
    read_at: optionalString(raw.read_at),
    created_at: createdAt,
    requires_acknowledgement: raw.requires_acknowledgement === true,
    acknowledged_at: optionalString(raw.acknowledged_at),
  };
}

function apiErrorMessage(body: unknown): string {
  const raw = asRecord(body);
  return typeof raw?.detail === 'string' || typeof raw?.error === 'string'
    ? String(raw.detail ?? raw.error)
    : 'Impossibile aggiornare la notifica';
}

async function notificationRequest(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const base = config.api.notificationsBaseURL;
  if (!base) throw new NotificationApiError('Servizio notifiche non configurato', 503);

  const token = await getAccessToken();
  if (!token) throw new NotificationApiError('Sessione non valida', 401);

  const response = await fetch(new URL(path, base), {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Accept-Encoding': 'identity',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    cache: 'no-store',
    redirect: 'error',
    signal: init.signal ?? AbortSignal.timeout(config.api.timeout),
  });
  const body = await readBoundedResponseJson(response, MAX_RESPONSE_BYTES).catch(() => null);
  if (!response.ok) throw new NotificationApiError(apiErrorMessage(body), response.status);
  return body;
}

export const fetchNotificationSnapshot = cache(async (): Promise<NotificationSnapshot> => {
  try {
    const body = await notificationRequest(
      `/notifications?only_unread=true&limit=${NOTIFICATION_LIMIT}&offset=0`,
    );
    const raw = asRecord(body);
    const items = Array.isArray(raw?.data)
      ? raw.data.map(mapNotification).filter((item): item is TournamentNotification => item !== null)
      : [];
    const unread =
      typeof raw?.unread === 'number' && Number.isSafeInteger(raw.unread) && raw.unread >= 0
        ? raw.unread
        : items.length;
    return { items, unread, available: true };
  } catch {
    // The header must never make the protected page fail when Auction is
    // unavailable during a rolling deploy or a transient network issue.
    return EMPTY_SNAPSHOT;
  }
});

export async function markNotificationRead(notificationId: number): Promise<void> {
  await notificationRequest(`/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export async function acknowledgeNotification(notificationId: number): Promise<void> {
  await notificationRequest(`/notifications/${notificationId}/acknowledge`, {
    method: 'PATCH',
  });
}
