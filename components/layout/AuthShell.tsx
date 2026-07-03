'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { getCdnImageUrl } from '@/lib/config';
import { LandingBackgroundVideo } from '@/components/feature/landing/LandingBackgroundVideo';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  children: ReactNode;
  contentClassName?: string;
  compact?: boolean;
  /** Hero a due metà a tutta larghezza (login split). */
  splitHero?: boolean;
}

function AuthLogo({
  compact,
  logoUrl,
}: {
  compact: boolean;
  logoUrl: string;
}) {
  return (
    <div className="flex shrink-0 justify-center px-4">
      <Link
        href="/"
        className={cn(
          'relative block object-contain',
          compact ? 'h-[68px] w-[170px] sm:h-[84px] sm:w-[220px]' : 'h-[80px] w-[200px] sm:h-[100px] sm:w-[260px]'
        )}
        aria-label="Vai alla home"
      >
        <Image
          src={logoUrl}
          alt="Ebartex"
          fill
          className="object-contain object-center"
          priority
          sizes="(max-width: 640px) 200px, 260px"
          unoptimized
        />
      </Link>
    </div>
  );
}

/**
 * Shell delle pagine auth — speculare a new_frontend_brx/components/layout/AuthShell.tsx.
 */
export function AuthShell({
  children,
  contentClassName,
  compact = false,
  splitHero = false,
}: AuthShellProps) {
  const carouselBg = getCdnImageUrl('carousel/slide1.jpg');
  const logoUrl = getCdnImageUrl('logo.png');

  if (splitHero) {
    return (
      <div className="relative h-screen max-h-screen w-full overflow-hidden bg-[#2d2d2d]">
        <LandingBackgroundVideo splitLeft />

        <div
          className="pointer-events-none absolute inset-0 z-0 lg:right-1/2"
          style={{
            background:
              'radial-gradient(120% 80% at 12% 8%, rgba(61,101,198,0.45) 0%, transparent 55%), linear-gradient(180deg, rgba(29,49,96,0.42) 0%, rgba(15,23,42,0.82) 100%)',
          }}
          aria-hidden
        />

        <div
          className="absolute inset-y-0 right-0 z-[1] hidden w-1/2 bg-white/90 lg:block"
          aria-hidden
        />

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2d2d2d]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${carouselBg}")` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-global-bg-start/25 via-[#2d2d2d]/40 to-global-bg-end/50 backdrop-blur-sm"
        aria-hidden
      />

      <div className={cn('relative z-10 flex min-h-screen flex-col', compact ? 'pt-4' : 'pt-8')}>
        <AuthLogo compact={compact} logoUrl={logoUrl} />
        <div
          className={cn(
            'mx-auto mt-6 w-full flex-1 px-4 pb-8 sm:mt-8 sm:pb-10',
            contentClassName ?? 'max-w-xl'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
