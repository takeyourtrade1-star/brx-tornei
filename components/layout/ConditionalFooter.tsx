'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Nasconde il footer nelle viste immersive e nella scelta iniziale del profilo.
 */
function shouldHideFooter(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/imposta-username') return true;
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
