'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';

export default function TorneiLoading() {
  const [progress, setProgress] = useState(0);
  const logoUrl = getCdnImageUrl('logo.png');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Increment in steps to look like a real game loading assets
        const diff = Math.floor(Math.random() * 15) + 5;
        return Math.min(prev + diff, 100);
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseText {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .gaming-loading-text {
          animation: pulseText 1.5s ease-in-out infinite;
        }
      `}} />

      {/* MOBILE LOAD STATE (Standard skeleton layout) */}
      <div className="block md:hidden min-h-screen bg-[#0f172a]" aria-busy="true" aria-label="Caricamento tornei">
        <div className="header-gradient h-20 w-full" />
        <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10" />
            <div className="h-11 w-44 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="brx-glass h-72 animate-pulse rounded-3xl border border-white/15" />
        </div>
      </div>

      {/* DESKTOP LOAD STATE (Gaming style loading screen) */}
      <div className="hidden md:flex fixed inset-0 w-screen h-screen z-[100] flex-col items-center justify-center select-none"
           style={{
             background: 'radial-gradient(1100px 650px at 50% 28%, #142347 0%, #0d111c 65%, #2e1b10 100%)'
           }}
      >
        <div className="flex flex-col items-center gap-6 max-w-xs w-full text-center">
          {/* Glowing brand logo */}
          <div className="relative mb-2 transition-transform duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-[#FF7300]/20 blur-xl rounded-full scale-110 animate-pulse" />
            <Image
              src={logoUrl}
              alt="Ebartex Logo"
              width={140}
              height={48}
              className="h-12 w-auto object-contain relative z-10"
              priority
              unoptimized
            />
          </div>

          {/* Loading status */}
          <div className="flex flex-col gap-2 mt-4">
            <span className="font-sans text-xs font-black tracking-[0.25em] text-[#FF7300] drop-shadow-[0_0_8px_rgba(255,115,0,0.5)] gaming-loading-text uppercase">
              Caricamento mini-gioco
            </span>
            <span className="font-mono text-xs text-white/40 tracking-wider">
              {progress < 100 ? `Preparazione asset stanza... ${Math.round(progress)}%` : 'Pronto! Avvio in corso...'}
            </span>
          </div>

          {/* Progress bar container */}
          <div className="w-64 h-3 rounded-full bg-white/5 border border-white/10 p-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF7300] to-[#ffd76e] transition-all duration-150 ease-out shadow-[0_0_8px_rgba(255,115,0,0.7)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
