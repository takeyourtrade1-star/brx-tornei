'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Nasconde il footer nelle schermate di gioco live o sessioni webcam telefono
 * dove lo schermo deve occupare interamente il viewport senza scrolling.
 */
function shouldHideFooter(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname.includes('/live')) return true;
  if (pathname.startsWith('/tornei/webcam')) return true;
  return false;
}

export function ConditionalFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (shouldHideFooter(pathname)) {
    return null;
  }
  return <>{children}</>;
}
