'use client';

import { useEffect, useState, type RefObject } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormatScrollHintProps {
  scrollRef: RefObject<HTMLDivElement | null>;
}

/** Indicatore mobile sotto il fan dei formati: visibile solo con overflow e prima dello scroll. */
export function FormatScrollHint({ scrollRef }: FormatScrollHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 2;
      const nearStart = el.scrollLeft < 12;
      setVisible(hasOverflow && nearStart);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);

    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [scrollRef]);

  return (
    <p
      role="status"
      aria-hidden={!visible}
      className={cn(
        'md:hidden flex items-center justify-center gap-2.5 -mt-1 px-4',
        'transition-all duration-500 ease-out',
        visible
          ? 'pointer-events-none opacity-100 translate-y-0 pb-2'
          : 'pointer-events-none h-0 overflow-hidden opacity-0 -translate-y-1 py-0'
      )}
    >
      <span className="format-scroll-hint-chevron-left text-primary" aria-hidden>
        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-sans text-xs font-medium tracking-wide text-white/60 backdrop-blur-sm">
        Scorri per esplorare i formati
      </span>
      <span className="format-scroll-hint-chevron-right text-primary" aria-hidden>
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </p>
  );
}
