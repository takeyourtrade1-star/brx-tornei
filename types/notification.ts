export type TournamentNotificationType = 'MODERATION_OUTCOME' | string;

export interface TournamentNotification {
  readonly id: number;
  readonly type: TournamentNotificationType;
  readonly title: string;
  readonly body: string;
  readonly related_kind: string | null;
  readonly related_id: number | null;
  readonly payload?: Record<string, unknown> | null;
  readonly read_at: string | null;
  readonly created_at: string;
  readonly requires_acknowledgement?: boolean;
  readonly acknowledged_at?: string | null;
}

export interface TournamentNotificationListResponse {
  readonly success: boolean;
  readonly data: TournamentNotification[];
  readonly total: number;
  readonly unread: number;
  readonly limit: number;
  readonly offset: number;
}

export interface TournamentNotificationUnreadResponse {
  readonly success: boolean;
  readonly data: { readonly unread: number };
}

export interface NotificationSnapshot {
  readonly items: TournamentNotification[];
  readonly unread: number;
  readonly available: boolean;
}

export function notificationNeedsAcknowledgement(
  notification: TournamentNotification,
): boolean {
  return notification.requires_acknowledgement === true && !notification.acknowledged_at;
}
