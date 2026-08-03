import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';

/** Path di default dopo login se redirect mancante o non valido. */
export const DEFAULT_POST_LOGIN_PATH = DEFAULT_TOURNAMENTS_PATH;
/**
 * Solo path relativi interni: evita open redirect.
 * Stessa logica del bridge SSO e del middleware Ebartex.
 */
export function sanitizeRedirect(redirect: string | null | undefined): string {
  if (
    !redirect ||
    redirect.length > 2048 ||
    !redirect.startsWith('/') ||
    redirect.startsWith('//') ||
    redirect.includes('\\') ||
    /%(?:2f|5c)/i.test(redirect) ||
    /[\u0000-\u001f\u007f]/.test(redirect)
  ) {
    return DEFAULT_POST_LOGIN_PATH;
  }
  try {
    const sentinel = 'https://redirect.invalid';
    const parsed = new URL(redirect, sentinel);
    if (parsed.origin !== sentinel) return DEFAULT_POST_LOGIN_PATH;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return DEFAULT_POST_LOGIN_PATH;
  }
}

/** Query string per redirect al login (middleware / bridge). */
export function buildLoginRedirectUrl(pathname: string, search: string): string {
  const target = `${pathname}${search}`;
  return `?accesso=1&redirect=${encodeURIComponent(target)}`;
}
