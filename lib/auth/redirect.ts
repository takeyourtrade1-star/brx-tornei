/** Path di default dopo login se redirect mancante o non valido. */
export const DEFAULT_POST_LOGIN_PATH = '/hub';

/**
 * Solo path relativi interni: evita open redirect.
 * Stessa logica del bridge SSO e del middleware Ebartex.
 */
export function sanitizeRedirect(redirect: string | null | undefined): string {
  if (
    !redirect ||
    !redirect.startsWith('/') ||
    redirect.startsWith('//') ||
    redirect.includes('://')
  ) {
    return DEFAULT_POST_LOGIN_PATH;
  }
  return redirect;
}

/** Query string per redirect al login (middleware / bridge). */
export function buildLoginRedirectUrl(pathname: string, search: string): string {
  const target = `${pathname}${search}`;
  return `?accesso=1&redirect=${encodeURIComponent(target)}`;
}
