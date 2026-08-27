'use server';

import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import {
  acknowledgeNotification,
  fetchNotificationSnapshot,
  markNotificationRead,
  NotificationApiError,
} from '@/lib/data/notifications';
import type { NotificationSnapshot } from '@/types/notification';

const notificationIdSchema = z.number().int().positive().safe();

export interface NotificationActionState {
  ok?: true;
  error?: string;
}

export type NotificationSnapshotActionState =
  | { ok: true; snapshot: NotificationSnapshot }
  | { ok: false; error: string };

/** Ricarica il contenuto della campanellina sul server quando viene aperta. */
export async function fetchNotificationSnapshotAction(): Promise<NotificationSnapshotActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione scaduta. Accedi di nuovo.' };
  return { ok: true, snapshot: await fetchNotificationSnapshot() };
}

export async function acknowledgeNotificationAction(
  input: unknown,
): Promise<NotificationActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta. Accedi di nuovo.' };

  const parsed = notificationIdSchema.safeParse(input);
  if (!parsed.success) return { error: 'Notifica non valida.' };

  try {
    await acknowledgeNotification(parsed.data);
    return { ok: true };
  } catch (error) {
    return notificationActionError(error, 'Impossibile confermare la notifica.');
  }
}

export async function markNotificationReadAction(
  input: unknown,
): Promise<NotificationActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta. Accedi di nuovo.' };

  const parsed = notificationIdSchema.safeParse(input);
  if (!parsed.success) return { error: 'Notifica non valida.' };

  try {
    await markNotificationRead(parsed.data);
    return { ok: true };
  } catch (error) {
    // A second tab may already have marked the item read. Treat this as a
    // successful UI operation while preserving 404 indistinguishability for
    // notifications not owned by the current user.
    if (error instanceof NotificationApiError && error.status === 404) {
      return { ok: true };
    }
    return notificationActionError(error, 'Impossibile aggiornare la notifica.');
  }
}

function notificationActionError(error: unknown, fallback: string): NotificationActionState {
  if (error instanceof NotificationApiError && error.status === 401) {
    return { error: 'Sessione scaduta. Accedi di nuovo.' };
  }
  return { error: fallback };
}
