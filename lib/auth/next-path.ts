/**
 * Path di ritorno dopo login/bridge SSO.
 * Solo path relativi interni: evita open redirect.
 */

export function sanitizeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/hub';
  return next;
}

/** URL login con parametro `next` per riprendere il flusso interrotto. */
export function loginPathWithNext(pathname: string, search = ''): string {
  const dest = `${pathname}${search}`;
  if (!dest || dest === '/') return '/login';
  return `/login?next=${encodeURIComponent(dest)}`;
}
