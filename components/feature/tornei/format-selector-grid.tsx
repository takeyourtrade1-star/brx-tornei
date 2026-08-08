'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FORMATS_WITH_MEDIA } from '@/lib/data/format-media';
import type { ModeId } from '@/lib/data/catalog';
import type { FormatFilter } from '@/lib/validations/selection';
import { cn } from '@/lib/utils';
import { FormatPillSelect } from '@/components/feature/tornei/format-pill-select';
import { AllFormatsBar } from '@/components/feature/tornei/all-formats-bar';

const TILE_EASE =
  'transition-[transform,box-shadow,filter] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

interface FormatSelectorGridProps {
  selectedFormatId: FormatFilter;
  currentModeId: ModeId;
  compact?: boolean;
  /** Card più basse per la barra filtri della lobby, mantenendo nome e hover. */
  dense?: boolean;
  /** Layout dedicato mobile: pillole orizzontali (immagine + nome). */
  mobile?: boolean;
}

export function FormatSelectorGrid({
  selectedFormatId,
  currentModeId,
  compact = false,
  dense = false,
  mobile = false,
}: FormatSelectorGridProps) {
  const router = useRouter();
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Dopo il mount forza il prefetch dei metadata: all'hover il play è subito
  // fluido, senza che l'utente debba prima "svegliare" il video col mouse.
  useEffect(() => {
    for (const video of videoRefs.current.values()) {
      try {
        if (video.preload === 'none') {
          video.preload = 'metadata';
          video.load();
        }
      } catch {
        /* prefetch non critico */
      }
    }
  }, []);

  const playVideo = useCallback((id: string) => {
    const video = videoRefs.current.get(id);
    if (!video) return;
    try {
      if (video.preload === 'none') {
        video.preload = 'auto';
        video.load();
      }
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

  const selectFormat = (formatId: FormatFilter) => {
    if (formatId === selectedFormatId) return;
    router.replace(`/tornei?format=${formatId}&mode=${currentModeId}`, { scroll: false });
  };

  if (mobile) {
    return (
      <FormatPillSelect
        includeAll
        value={selectedFormatId}
        onChange={selectFormat}
        ariaLabelledBy="tornei-format-label"
      />
    );
  }

  const isAllSelected = selectedFormatId === 'all';

  return (
    <div
      className={cn(
        'flex w-full flex-col transition-[gap] duration-300 ease-out motion-reduce:transition-none',
        compact ? 'gap-2' : 'gap-2.5',
      )}
    >
      <AllFormatsBar selected={isAllSelected} onSelect={() => selectFormat('all')} />
      <div
        className={cn(
          'w-full transition-[gap,padding] duration-300 ease-out motion-reduce:transition-none',
          compact
            ? 'flex justify-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none'
            : dense
              ? '-my-4 flex flex-nowrap gap-2.5 overflow-x-auto py-4 sm:gap-3 md:overflow-visible'
              : '-my-6 flex flex-nowrap gap-2.5 overflow-x-auto py-6 sm:gap-3 md:overflow-visible',
        )}
      >
        {FORMATS_WITH_MEDIA.map((format, index) => {
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
              'group relative min-w-0 overflow-hidden rounded-2xl bg-header-bg/80',
              dense && !compact ? 'aspect-[4/3]' : 'aspect-video',
              TILE_EASE,
              compact
                ? 'w-[4.5rem] sm:w-[5.25rem]'
                : cn(
                    'origin-center first:origin-left last:origin-right hover:z-20 hover:-translate-y-0.5 hover:scale-[1.12] motion-reduce:hover:scale-100',
                    dense
                      ? 'w-[9rem] shrink-0 sm:w-[10rem] md:flex-1 md:basis-0'
                      : 'flex-1 basis-0',
                  ),
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset',
              !isSelected &&
                'shadow-[0_6px_18px_-10px_rgba(15,23,42,0.28)] hover:shadow-[0_20px_42px_-16px_rgba(15,23,42,0.5)]',
              isSelected &&
                'z-[1] ring-2 ring-inset ring-white/85 shadow-[0_14px_32px_-14px_rgba(15,23,42,0.55)]',
            )}
          >
            <Image
              src={format.image}
              alt={format.name}
              fill
              priority
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
              className={cn(
                'object-cover transition-[filter,transform] duration-500 ease-out motion-reduce:transition-none',
                !isSelected &&
                  'brightness-[0.96] saturate-[0.9] group-hover:brightness-[1.04] group-hover:saturate-100',
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
              preload="metadata"
              className={cn(
                'pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-[opacity,filter] duration-300 ease-out group-hover:opacity-100 max-md:hidden motion-reduce:transition-none',
                !isSelected &&
                  'brightness-[0.96] saturate-[0.92] group-hover:brightness-[1.04] group-hover:saturate-100',
              )}
            />
            {/* Velo leggibile: scurisce solo ciò che non è selezionato */}
            {!isSelected && (
              <span
                className="pointer-events-none absolute inset-0 z-[1] bg-header-bg/20 transition-colors duration-300 group-hover:bg-header-bg/5"
                aria-hidden
              />
            )}
            {!compact && (
              <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 z-[2] flex justify-center sm:inset-x-2 sm:bottom-2">
                <span
                  className={cn(
                    'inline-flex max-w-full items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase leading-none tracking-wide backdrop-blur-sm transition-colors duration-300 sm:px-3 sm:text-[11px]',
                    isSelected
                      ? 'border-white/70 bg-white/95 text-header-bg'
                      : 'border-white/20 bg-black/60 text-white group-hover:border-white/50 group-hover:bg-black/75',
                  )}
                  style={!isSelected ? { transitionDelay: `${index * 12}ms` } : undefined}
                >
                  <span className="truncate">{format.name}</span>
                </span>
              </span>
            )}
            {/* Alone luminoso sulla tile selezionata che "respira" piano */}
            {isSelected && (
              <span
                className="format-selected-glow pointer-events-none absolute inset-0 z-[3] rounded-2xl"
                aria-hidden
              />
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}
