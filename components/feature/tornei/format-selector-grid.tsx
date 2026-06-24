'use client';

import { useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FORMATS_WITH_MEDIA } from '@/lib/data/format-media';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';
import { StyledSelect } from '@/components/ui/styled-select';

const CARD_MORPH_EASE =
  'transition-[width,flex-basis,max-width,transform,box-shadow,filter,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0';

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

  // Mobile: dropdown compatto (niente scroll laterale, una sola riga).
  // L'immagine del formato selezionato fa da sfondo sfumato sulla metà destra.
  if (mobile) {
    const current = FORMATS_WITH_MEDIA.find((f) => f.id === selectedFormatId);
    return (
      <div className="relative w-full overflow-hidden rounded-full bg-header-bg/80 ring-1 ring-white/[0.12]">
        {current && (
          <span className="pointer-events-none absolute inset-0" aria-hidden>
            <Image
              src={current.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover object-center brightness-90"
              draggable={false}
            />
            {/* Sfumatura: pieno a sinistra (testo leggibile) → immagine visibile a destra. */}
            <span className="absolute inset-0 bg-gradient-to-r from-header-bg via-header-bg/65 to-header-bg/10" />
          </span>
        )}
        <StyledSelect
          value={selectedFormatId}
          onChange={(id) => selectFormat(id)}
          options={FORMATS_WITH_MEDIA.map((f) => ({ value: f.id, label: f.name }))}
          variant="pill"
          ariaLabelledBy="tornei-format-label"
          className="relative flex w-full"
          triggerClassName="w-full justify-between bg-transparent px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-white ring-0 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] hover:bg-white/[0.04]"
        />
      </div>
    );
  }

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
              'group relative aspect-video shrink-0 overflow-hidden rounded-3xl',
              CARD_MORPH_EASE,
              compact
                ? 'w-[4.5rem] sm:w-[5.25rem]'
                : 'w-[calc(50%-0.25rem)] hover:z-10 hover:scale-[1.04] sm:w-[calc(25%-0.5625rem)] lg:w-auto lg:min-w-0 lg:flex-1',
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
                'object-cover transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
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
                'pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 max-md:hidden motion-reduce:transition-none',
                !isSelected && 'brightness-90 saturate-[0.85] group-hover:brightness-105 group-hover:saturate-100',
              )}
            />
            {!isSelected && (
              <span
                className="pointer-events-none absolute inset-0 z-[1] bg-black/25 transition-colors duration-500 group-hover:bg-black/5"
                aria-hidden
              />
            )}
            <span
              className={cn(
                'absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/35 to-transparent text-center font-sans font-bold uppercase tracking-wide transition-[padding,font-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                compact
                  ? 'px-1 pb-0.5 pt-3 text-[7px] leading-tight sm:text-[8px]'
                  : 'px-3 pb-2.5 pt-8 text-[11px] sm:text-sm',
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
