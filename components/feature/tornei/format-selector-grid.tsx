'use client';

import { useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FORMATS_WITH_MEDIA } from '@/lib/data/format-media';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';
import { FormatPillSelect } from '@/components/feature/tornei/format-pill-select';

const CARD_MORPH_EASE =
  'transition-[width,flex-basis,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0';

interface FormatSelectorGridProps {
  selectedFormatId: FormatId;
  currentModeId: ModeId;
  compact?: boolean;
  /** Layout dedicato mobile: pillole orizzontali (immagine + nome). */
  mobile?: boolean;
}

export function FormatSelectorGrid({
  selectedFormatId,
  currentModeId,
  compact = false,
  mobile = false,
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

  if (mobile) {
    return (
      <FormatPillSelect
        value={selectedFormatId}
        onChange={selectFormat}
        ariaLabelledBy="tornei-format-label"
      />
    );
  }

    return (
      <div
        className={cn(
          'w-full transition-[gap,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0',
          compact
            ? 'flex justify-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none'
            : 'grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5',
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
              'group relative aspect-video overflow-hidden rounded-2xl',
              CARD_MORPH_EASE,
              compact
                ? 'w-[4.5rem] sm:w-[5.25rem]'
                : 'w-3/4 justify-self-center hover:z-10 hover:scale-[1.04]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              !isSelected && 'shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]',
              isSelected &&
                'z-[1] ring-[3px] ring-primary ring-inset shadow-[0_0_28px_-6px_rgba(255,115,0,0.45)]',
            )}
          >
            <Image
              src={format.image}
              alt={format.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
              className={cn(
                'object-cover transition-[filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                !isSelected && 'brightness-90 saturate-[0.85] group-hover:brightness-105 group-hover:saturate-100',
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
                'pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-[opacity,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 max-md:hidden motion-reduce:transition-none',
                !isSelected && 'brightness-90 saturate-[0.85] group-hover:brightness-105 group-hover:saturate-100',
              )}
            />
            {!isSelected && (
              <span
                className="pointer-events-none absolute inset-0 z-[1] bg-black/25 transition-colors duration-300 group-hover:bg-black/5"
                aria-hidden
              />
            )}
            <span
              className={cn(
                'absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/35 to-transparent text-center font-sans font-bold uppercase tracking-wide transition-[padding,font-size] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                compact
                  ? 'px-1 pb-0.5 pt-3 text-[7px] leading-tight sm:text-[8px]'
                  : 'px-2 pb-2 pt-6 text-[10px] sm:text-xs md:text-sm',
                isSelected ? 'text-white' : 'text-white/70 group-hover:text-white',
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
