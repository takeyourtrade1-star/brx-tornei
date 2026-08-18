import { publicConfig } from '@/lib/public-config';

const DND_STORAGE_KEY = 'ebartex_social_dnd_until';

/**
 * Restituisce l'URL assoluto del profilo Ebartex (principale) dell'utente o di un altro giocatore.
 */
export function getEbartexProfileUrl(gamertag?: string | null): string {
  const base = publicConfig.app.mainSiteUrl || 'https://www.ebartex.com';
  if (!gamertag) return `${base}/profilo`;
  return `${base}/profilo/${encodeURIComponent(gamertag)}`;
}

export interface DndStatus {
  active: boolean;
  minutesRemaining: number;
  expiresAt: number | null;
}

/**
 * Legge lo stato "Non disturbare" dal client storage.
 */
export function getDndStatus(): DndStatus {
  if (typeof window === 'undefined') {
    return { active: false, minutesRemaining: 0, expiresAt: null };
  }
  try {
    const raw = localStorage.getItem(DND_STORAGE_KEY);
    if (!raw) return { active: false, minutesRemaining: 0, expiresAt: null };
    const expiresAt = parseInt(raw, 10);
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      localStorage.removeItem(DND_STORAGE_KEY);
      return { active: false, minutesRemaining: 0, expiresAt: null };
    }
    const minutesRemaining = Math.max(1, Math.ceil((expiresAt - Date.now()) / (60 * 1000)));
    return { active: true, minutesRemaining, expiresAt };
  } catch {
    return { active: false, minutesRemaining: 0, expiresAt: null };
  }
}

/**
 * Attiva o disattiva il "Non disturbare" per una durata specificata (default: 60 minuti).
 */
export function setDndStatus(active: boolean, durationMinutes = 60): DndStatus {
  if (typeof window === 'undefined') {
    return { active: false, minutesRemaining: 0, expiresAt: null };
  }
  try {
    if (!active) {
      localStorage.removeItem(DND_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('ebartex-dnd-changed', { detail: { active: false } }));
      return { active: false, minutesRemaining: 0, expiresAt: null };
    }
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    localStorage.setItem(DND_STORAGE_KEY, expiresAt.toString());
    window.dispatchEvent(
      new CustomEvent('ebartex-dnd-changed', { detail: { active: true, expiresAt } }),
    );
    return { active: true, minutesRemaining: durationMinutes, expiresAt };
  } catch {
    return { active: false, minutesRemaining: 0, expiresAt: null };
  }
}
