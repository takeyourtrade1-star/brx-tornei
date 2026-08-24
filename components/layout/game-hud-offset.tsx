'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Riserva spazio al dock mobile e alla rail destra, tranne in partita live. */
export function GameHudOffset({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const live = pathname.includes('/live');

  return (
    <div className={cn(!live && 'pb-24 md:pb-8 md:pr-[13.25rem]')}>
      {children}
    </div>
  );
}
