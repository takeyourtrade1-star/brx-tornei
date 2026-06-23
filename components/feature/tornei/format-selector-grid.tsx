'use client';

import { useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FORMATS_WITH_MEDIA } from '@/lib/data/format-media';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';

const CARD_MORPH_EASE =
  'transition-[width,flex-basis,max-width,transform,box-shadow,filter,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0';

interface FormatSelectorGridProps {
  selectedFormatId: FormatId;
  currentModeId: ModeId;
  compact?: boolean;
}

export function FormatSelectorGrid({
  selectedFormatId,
  currentModeId,
  compact = false,
}: FormatSelectorGridProps) {
  const router = useRouter();
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const playVideo = useCallback((id: string) => {
    const video = videoRefs.current.get(id);
    if (!video) return;
    try {
      video.currentTime = 0;
      const promise = video.play();
      if (promise?.catch) promise.catch(() => {});
    } catch {
      /* autoplay interrotto */
    }
  }, []);

  const pauseVideo = useCallback((id: string) => {
    const video = videoRefs.current.get(id);
    if (!video) return;
    try {
      video.pause();
      video.currentTime = 0;
    } catch {
      /* noop */
    }
  }, []);

  const selectFormat = (formatId: FormatId) => {
    if (formatId === selectedFormatId) return;
    router.replace(`/tornei?format=${formatId}&mode=${currentModeId}`, { scroll: false });
  };

  return (
    <div
      className={cn(
        'flex w-full transition-[gap,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0',
        compact
          ? 'justify-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none'
          : 'flex-wrap gap-2 sm:gap-2.5 lg:flex-nowrap lg:gap-2',
      )}
    >
      {FORMATS_WITH_MEDIA.map((format) => {
        const isSelected = format.id === selectedFormatId;
        return (
          <button
            key={format.id}
            type="button"
            onClick={() => selectFormat(format.id)}
            onMouseEnter={() => playVideo(format.id)}
            onMouseLeave={() => pauseVideo(format.id)}
            aria-pressed={isSelected}
            aria-label={`Formato ${format.name}`}
            className={cn(
              'group relative aspect-video shrink-0 overflow-hidden rounded-xl',
              CARD_MORPH_EASE,
              compact
                ? 'w-[4.5rem] sm:w-[5.25rem]'
                : 'w-[calc(50%-0.25rem)] hover:z-10 hover:scale-[1.04] sm:w-[calc(25%-0.5625rem)] lg:w-auto lg:min-w-0 lg:flex-1',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              isSelected &&
                'z-[1] shadow-[inset_0_0_0_2px_#FF7300,0_0_16px_rgba(255,115,0,0.25)]',
              !isSelected && 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]',
            )}
          >
            <Image
              src={format.image}
              alt={format.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
              className={cn(
                'object-cover transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                !isSelected && 'brightness-[0.55] saturate-75 group-hover:brightness-90 group-hover:saturate-100',
              )}
              draggable={false}
            />
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(format.id, el);
                else videoRefs.current.delete(format.id);
              }}
              src={format.video}
              muted
              loop
              playsInline
              preload="none"
              className={cn(
                'pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 max-md:hidden motion-reduce:transition-none',
                !isSelected && 'brightness-[0.55] saturate-75 group-hover:brightness-90 group-hover:saturate-100',
              )}
            />
            {!isSelected && (
              <span
                className="pointer-events-none absolute inset-0 z-[1] bg-black/35 transition-colors duration-500 group-hover:bg-black/10"
                aria-hidden
              />
            )}
            <span
              className={cn(
                'absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/40 to-transparent text-center font-sans font-bold uppercase tracking-wide transition-[padding,font-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                compact
                  ? 'px-1 pb-0.5 pt-3 text-[7px] leading-tight sm:text-[8px]'
                  : 'px-2 pb-1.5 pt-6 text-[10px] sm:text-xs',
                isSelected ? 'text-white' : 'text-white/60 group-hover:text-white/90',
              )}
            >
              {format.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
