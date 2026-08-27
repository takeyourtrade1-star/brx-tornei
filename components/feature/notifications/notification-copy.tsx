import { Bell, CircleAlert } from 'lucide-react';
import type { TournamentNotification } from '@/types/notification';

const REASONS: Record<string, string> = {
  misleading_content: 'presentava contenuti fuorvianti',
  suspected_counterfeit: 'presentava segnali di possibile contraffazione',
  prohibited_listing: 'riguardava un articolo non consentito',
  fraud_risk: 'presentava un rischio di frode',
  policy_violation: 'violava le regole della piattaforma',
};

function payloadString(notification: TournamentNotification, key: string): string | null {
  const value = notification.payload?.[key];
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 240) : null;
}

export interface NotificationCopyData {
  title: string;
  body: string;
  warning: string | null;
  moderation: boolean;
}

export function copyFor(notification: TournamentNotification): NotificationCopyData {
  if (notification.type !== 'MODERATION_OUTCOME') {
    return {
      title: notification.title,
      body: notification.body,
      warning: null,
      moderation: false,
    };
  }
  const action = payloadString(notification, 'action');
  const source = payloadString(notification, 'source');
  const label = payloadString(notification, 'resource_label');
  const reason =
    REASONS[payloadString(notification, 'reason_code') ?? ''] ??
    'non rispettava le regole della piattaforma';
  if (action === 'listing_removed') {
    return {
      title: 'La tua vendita è stata rimossa',
      body: label
        ? `La vendita di «${label}» è stata rimossa perché ${reason}.`
        : `La tua vendita è stata rimossa perché ${reason}.`,
      warning: 'Il ripetersi di violazioni simili può comportare sanzioni o limitazioni sul tuo account.',
      moderation: true,
    };
  }
  return {
    title: 'Una segnalazione che ti riguarda è stata esaminata',
    body: `Abbiamo esaminato una segnalazione relativa alla tua attività su ${source === 'marketplace' ? 'Marketplace' : 'Tornei'} e registrato l’esito.`,
    warning: 'Il ripetersi di violazioni simili può comportare sanzioni o limitazioni sul tuo account.',
    moderation: true,
  };
}

export function safeNotificationPath(notification: TournamentNotification): string | null {
  // Auction is shared with the marketplace: a Marketplace path is not a
  // valid route on the Tornei host and must never become a broken link.
  if (payloadString(notification, 'source') !== 'tournaments') return null;
  const value = payloadString(notification, 'resource_path');
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.includes('?') ||
    value.includes('#') ||
    /[\u0000-\u001f\u007f\s]/.test(value)
  ) {
    return null;
  }
  return value;
}

function relativeTime(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  if (elapsed < 60_000) return 'ora';
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ore fa`;
  return `${Math.floor(hours / 24)} giorni fa`;
}

export function NotificationCopy({
  notification,
  copy,
}: {
  notification: TournamentNotification;
  copy: NotificationCopyData;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {copy.moderation ? <CircleAlert className="h-4 w-4" aria-hidden /> : <Bell className="h-4 w-4" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-primary">
          <span>{copy.moderation ? 'Moderazione' : 'Attività'}</span>
          <span className="font-normal normal-case text-slate-400">{relativeTime(notification.created_at)}</span>
        </span>
        <span className="mt-1 block text-sm font-bold text-slate-900">{copy.title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-600">{copy.body}</span>
        {copy.warning ? (
          <span className="mt-2 block rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-800">
            {copy.warning}
          </span>
        ) : null}
      </span>
    </div>
  );
}
