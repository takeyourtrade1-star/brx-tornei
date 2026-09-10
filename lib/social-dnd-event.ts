export const SOCIAL_DND_CHANGED_EVENT = 'ebartex-social-dnd-changed';

export interface SocialDndChangedDetail {
  dndUntil: number | null;
}

/**
 * Aggiorna gli indicatori client già montati dopo il salvataggio della
 * preferenza. La preferenza resta comunque persistita dal servizio Tornei.
 */
export function announceSocialDndChange(dndUntil: number | null): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<SocialDndChangedDetail>(SOCIAL_DND_CHANGED_EVENT, {
      detail: { dndUntil },
    }),
  );
}
