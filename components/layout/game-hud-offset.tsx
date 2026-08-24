'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Riserva spazio solo al dock mobile. La rail destra è overlay: il contenuto resta centrato. */
export function GameHudOffset({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const live = pathname.includes('/live');

  return (
    <div className={cn(!live && 'pb-24 md:pb-8')}>
      {children}
    </div>
  );
}
