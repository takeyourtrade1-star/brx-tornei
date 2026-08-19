import { publicConfig } from '@/lib/public-config';

const DND_STORAGE_KEY = 'ebartex_social_dnd_until';
const EBARTEX_VISIBILITY_KEY = 'ebartex_profile_visibility';

/**
 * Restituisce l'URL assoluto del profilo Ebartex Marketplace.
 * Se ebartexUsername non è specificato, punta a `/profilo` (profilo dell'utente corrente).
 */
export function getEbartexProfileUrl(ebartexUsername?: string | null): string {
  const base = publicConfig.app.mainSiteUrl || 'https://www.ebartex.com';
  const trimmed = ebartexUsername?.trim();
  if (!trimmed) return `${base}/profilo`;
  return `${base}/users/${encodeURIComponent(trimmed)}`;
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

/**
 * Legge la preferenza di visibilità del profilo Ebartex agli altri giocatori (default: true).
 */
export function getEbartexVisibility(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(EBARTEX_VISIBILITY_KEY);
    if (stored === null) return true;
    return stored !== 'false';
  } catch {
    return true;
  }
}

/**
 * Salva la preferenza di visibilità del profilo Ebartex agli altri giocatori.
 */
export function setEbartexVisibility(visible: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EBARTEX_VISIBILITY_KEY, visible ? 'true' : 'false');
    window.dispatchEvent(
      new CustomEvent('ebartex-visibility-changed', { detail: { visible } }),
    );
  } catch {
    // ignore
  }
}
