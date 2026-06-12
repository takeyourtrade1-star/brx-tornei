/**
 * Classificazione route per il middleware auth.
 * Pubbliche: browsing senza login. Protette: gestione personale.
 */

const PUBLIC_PREFIXES = ['/hub', '/tornei', '/login', '/registrati', '/auth/bridge'] as const;

const PROTECTED_PREFIXES = ['/mazzi', '/partite'] as const;

export function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
