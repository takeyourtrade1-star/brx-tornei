'use client';

import type { ReactNode } from 'react';
import { AUTH_SPLIT_PANEL_CLASS } from '@/components/layout/auth-split-styles';
import { AuthShell } from '@/components/layout/AuthShell';
import { cn } from '@/lib/utils';

/** Colonna sinistra: riserva il 50% desktop; il video è nello sfondo assoluto di AuthShell. */
const VIDEO_COLUMN_CLASS = cn(
  'hidden min-h-0 lg:col-start-1 lg:row-start-1 lg:block'
);

const FORM_COLUMN_BASE_CLASS = cn(
  'col-start-1 row-start-1 flex w-full flex-1 flex-col bg-white/90',
  'px-6 py-6 sm:px-8 sm:py-8',
  'lg:col-start-2 lg:min-h-0 lg:overflow-y-auto lg:bg-transparent',
  'lg:px-8 lg:py-10 xl:px-10 xl:py-12'
);

interface AuthSplitLayoutProps {
  children: ReactNode;
  formPlacement?: 'start' | 'center';
  className?: string;
  panelClassName?: string;
}

/** Layout auth 50/50: video a sinistra, form a destra. */
export function AuthSplitLayout({
  children,
  formPlacement = 'center',
  className,
  panelClassName,
}: AuthSplitLayoutProps) {
  const isCentered = formPlacement === 'center';

  return (
    <AuthShell splitHero compact>
      <aside className={VIDEO_COLUMN_CLASS} aria-hidden />

      <section
        className={cn(
          FORM_COLUMN_BASE_CLASS,
          isCentered ? 'justify-start lg:min-h-screen lg:justify-center' : 'justify-start',
          className
        )}
      >
        <div className={cn(AUTH_SPLIT_PANEL_CLASS, panelClassName)}>{children}</div>
      </section>
    </AuthShell>
  );
}
