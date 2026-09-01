import { publicConfig } from '@/lib/public-config';

/**
 * Restituisce l'URL assoluto del profilo Ebartex Marketplace.
 * Punta a `/users/[username]` solo con lo username Ebartex esplicito.
 * Senza username apre la ricerca, senza indovinare dal gamertag torneo.
 */
export function getEbartexProfileUrl(ebartexUsername?: string | null): string {
  const base = publicConfig.app.mainSiteUrl || 'https://www.ebartex.com';
  const target = ebartexUsername?.trim();
  if (!target) return `${base}/search/user`;
  return `${base}/users/${encodeURIComponent(target)}`;
}

export interface DndStatus {
  active: boolean;
  minutesRemaining: number;
  expiresAt: number | null;
}
