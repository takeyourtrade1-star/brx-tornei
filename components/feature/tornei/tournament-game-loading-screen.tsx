'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';
import {
  HEADER_BRX_LOGO_INTRINSIC_HEIGHT,
  HEADER_BRX_LOGO_INTRINSIC_WIDTH,
  HEADER_BRX_LOGO_PATH,
} from '@/components/layout/header-brx-column';

/** Schermata di caricamento desktop del minigioco tornei. */
export function TournamentGameLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const logoUrl = getCdnImageUrl(HEADER_BRX_LOGO_PATH);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const diff = Math.floor(Math.random() * 15) + 5;
        return Math.min(prev + diff, 100);
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] hidden h-screen w-screen select-none flex-col items-center justify-center md:flex"
      style={{
        background:
          'radial-gradient(1100px 650px at 50% 28%, #142347 0%, #0d111c 65%, #2e1b10 100%)',
      }}
      aria-busy="true"
      aria-label="Caricamento Ebartex Tournaments"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-8 px-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 scale-125 animate-pulse rounded-full bg-[#FF7300]/25 blur-2xl" />
          <Image
            src={logoUrl}
            alt="Ebartex"
            width={HEADER_BRX_LOGO_INTRINSIC_WIDTH}
            height={HEADER_BRX_LOGO_INTRINSIC_HEIGHT}
            className="relative z-10 h-24 w-auto object-contain sm:h-28 md:h-32"
            priority
            unoptimized
          />
        </div>

        <p className="font-sans text-lg font-semibold tracking-tight text-white/85 sm:text-xl">
          Caricamento Ebartex Tournaments
        </p>

        <div className="relative h-3 w-72 max-w-full overflow-hidden rounded-full border border-white/10 bg-white/5 p-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF7300] to-[#ffd76e] shadow-[0_0_8px_rgba(255,115,0,0.7)] transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
