'use client';

import { cn } from '@/lib/utils';

export function ScannerBetaNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute left-0 right-0 z-30 flex justify-center px-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex max-w-md items-center gap-2 rounded-full border border-white/12 bg-[#0a0f1a]/45 px-3 py-1.5 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
        <span className="rounded-full bg-[#FF7300]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#FF7300]">
          Beta
        </span>
        <p className="text-[10px] font-medium leading-snug text-white/65 sm:text-[11px]">
          Camera Match è in beta: tieni la carta ben illuminata e centrata nel riquadro.
        </p>
      </div>
    </div>
  );
}
