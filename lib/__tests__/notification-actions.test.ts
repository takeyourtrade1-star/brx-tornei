import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  fetchNotificationSnapshot: vi.fn(),
  acknowledgeNotification: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/data/notifications', () => ({
  NotificationApiError: class NotificationApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  fetchNotificationSnapshot: mocks.fetchNotificationSnapshot,
  acknowledgeNotification: mocks.acknowledgeNotification,
  markNotificationRead: mocks.markNotificationRead,
}));

import {
  acknowledgeNotificationAction,
  fetchNotificationSnapshotAction,
  markNotificationReadAction,
} from '@/actions/notifications';

describe('notification actions', () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.fetchNotificationSnapshot.mockReset();
    mocks.acknowledgeNotification.mockReset();
    mocks.markNotificationRead.mockReset();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.acknowledgeNotification.mockResolvedValue(undefined);
    mocks.markNotificationRead.mockResolvedValue(undefined);
  });

  it('conferma una notifica con id valido dopo aver riletto la sessione', async () => {
    const result = await acknowledgeNotificationAction(42);

    expect(result).toEqual({ ok: true });
    expect(mocks.getSession).toHaveBeenCalledOnce();
    expect(mocks.acknowledgeNotification).toHaveBeenCalledWith(42);
  });

  it('ricarica lo snapshot sul server quando la campanellina viene aperta', async () => {
    const snapshot = { items: [], unread: 0, available: true };
    mocks.fetchNotificationSnapshot.mockResolvedValue(snapshot);

    await expect(fetchNotificationSnapshotAction()).resolves.toEqual({
      ok: true,
      snapshot,
    });
    expect(mocks.fetchNotificationSnapshot).toHaveBeenCalledOnce();
  });

  it('rifiuta input non valido senza chiamare il backend', async () => {
    const result = await acknowledgeNotificationAction('not-an-id');

    expect(result).toEqual({ error: 'Notifica non valida.' });
    expect(mocks.acknowledgeNotification).not.toHaveBeenCalled();
  });

  it('tratta come riuscito un segna-letto ripetuto da un’altra scheda', async () => {
    const error = new (await import('@/lib/data/notifications')).NotificationApiError(
      'Not found',
      404,
    );
    mocks.markNotificationRead.mockRejectedValue(error);

    await expect(markNotificationReadAction(7)).resolves.toEqual({ ok: true });
  });
});
