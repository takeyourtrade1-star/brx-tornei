'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FormatItem {
  readonly id: string;
  readonly name: string;
}

interface FormatSelectorFanProps {
  formats: readonly FormatItem[];
  selectedId?: string;
}

/** Colore accent per ogni formato (derivato dai gradienti del design system). */
const CARD_META: Record<string, { accent: string; label: string }> = {
  'old-school': { accent: '#FF9F5A', label: 'Classico' },
  'premodern': { accent: '#4EEAEC', label: 'Nostalgico' },
  'pioneer': { accent: '#FF5A92', label: 'Non Rotante' },
  'modern': { accent: '#C89CFF', label: 'Dinamico' },
  'standard': { accent: '#4EEAEC', label: 'In Rotazione' },
  'legacy': { accent: '#FFB86A', label: 'Eterno' },
  'pauper': { accent: '#78D64B', label: 'Solo Comuni' },
  'commander': { accent: '#FF6BA0', label: 'Multiplayer' },
};

/** Mappatura degli ID dei formati ai rispettivi file immagine. */
const FORMAT_IMAGES: Record<string, string> = {
  'old-school': '/images/formats/old-school.png',
  'premodern': '/images/formats/pre-modern.png',
  'pioneer': '/images/formats/pioneer.png',
  'modern': '/images/formats/modern.png',
  'standard': '/images/formats/standard.png',
  'legacy': '/images/formats/legacy.png',
  'pauper': '/images/formats/pauper.png',
  'commander': '/images/formats/commander.png',
};

/** Mappatura degli ID dei formati ai rispettivi file video verticali. */
const FORMAT_VIDEOS: Record<string, string> = {
  'old-school': '/video-animazione-verticale/old-school-ver.mp4',
  'premodern': '/video-animazione-verticale/pre-modern-ver.mp4',
  'pioneer': '/video-animazione-verticale/piooner-ver.mp4',
  'modern': '/video-animazione-verticale/modern-ver.mp4',
  'standard': '/video-animazione-verticale/standard-ver.mp4',
  'legacy': '/video-animazione-verticale/legacy-ver.mp4',
  'pauper': '/video-animazione-verticale/pauper-ver.mp4',
  'commander': '/video-animazione-verticale/commander-ver.mp4',
};

export function FormatSelectorFan({ formats, selectedId }: FormatSelectorFanProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const playVideo = useCallback((id: string) => {
    const video = videoRefs.current.get(id);
    if (!video) return;
    try {
      video.currentTime = 0;
      const promise = video.play();
      if (promise && promise.catch) promise.catch(() => {});
    } catch {
      /* autoplay interrotto dal browser: lasciamo l'immagine statica */
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

  const scrollToModalita = useCallback(() => {
    setTimeout(() => {
      document.getElementById('modalita')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, []);

  const hasSelection = selectedId !== undefined;
  const isAnyCardHovered = hoveredIndex !== null;

  return (
    <div className="w-full py-4 overflow-x-auto scrollbar-none snap-x snap-mandatory">
      <div
        onMouseLeave={() => setHoveredIndex(null)}
        className="flex flex-row flex-nowrap justify-start lg:justify-center gap-4 px-4 sm:px-6 py-2 min-w-max lg:min-w-0"
      >
        {formats.map((format, index) => {
          const isSelected = selectedId === format.id;
          const isHovered = hoveredIndex === index;
          const meta = CARD_META[format.id] || { accent: '#ffffff', label: '' };
          const imagePath = FORMAT_IMAGES[format.id] || `/images/formats/${format.id}.png`;
          const videoPath = FORMAT_VIDEOS[format.id];

          // Regola opacità per evidenziare la selezione e l'hover
          let opacityClass = 'opacity-90';
          if (isSelected) {
            opacityClass = 'opacity-100';
          } else if (hasSelection) {
            opacityClass = 'opacity-45 hover:opacity-85';
          } else if (isAnyCardHovered) {
            opacityClass = isHovered ? 'opacity-100' : 'opacity-60';
          }

          const cardStyle = {
            borderColor: isSelected ? meta.accent : isHovered ? `${meta.accent}aa` : `${meta.accent}20`,
            boxShadow: isSelected
              ? `0 0 25px ${meta.accent}60, 0 0 50px ${meta.accent}20, inset 0 0 15px ${meta.accent}10`
              : isHovered
                ? `0 0 20px ${meta.accent}40, 0 0 35px ${meta.accent}15`
                : 'none',
          } as React.CSSProperties;

          return (
            <Link
              key={format.id}
              href={`/hub?format=${format.id}#modalita`}
              scroll={false}
              onClick={scrollToModalita}
              onMouseEnter={() => {
                setHoveredIndex(index);
                playVideo(format.id);
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                pauseVideo(format.id);
              }}
              style={cardStyle}
              className={cn(
                'group relative rounded-2xl overflow-hidden border-[1.5px] select-none cursor-pointer transition-all duration-300 ease-out snap-center',
                'w-[125px] sm:w-[145px] md:w-[155px] aspect-[357/933] shrink-0',
                'hover:-translate-y-2.5 hover:scale-[1.04]',
                opacityClass
              )}
            >
              <Image
                src={imagePath}
                alt={format.name}
                width={357}
                height={933}
                priority={index < 4}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
              />
              {videoPath && (
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(format.id, el);
                    else videoRefs.current.delete(format.id);
                  }}
                  src={videoPath}
                  poster={imagePath}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className={cn(
                    'absolute inset-0 z-10 object-cover w-full h-full transition-all duration-300',
                    isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-100'
                  )}
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
