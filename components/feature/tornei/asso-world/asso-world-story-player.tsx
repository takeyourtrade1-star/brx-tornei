'use client';

import { useEffect, useState } from 'react';
import { ASSO_WORLD_STORY_SENTENCES } from '@/lib/data/asso-world-story';
import { cn } from '@/lib/utils';

interface AssoWorldStoryPlayerProps {
  className?: string;
}

export function AssoWorldStoryPlayer({ className }: AssoWorldStoryPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const currentSentence = ASSO_WORLD_STORY_SENTENCES[currentIndex] ?? ASSO_WORLD_STORY_SENTENCES[0];

  useEffect(() => {
    // Entrata dolce
    const enterTimer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    const readDuration = currentSentence.durationMs ?? 5000;

    // Inizio dissolvenza in uscita dopo il tempo di lettura
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, readDuration);

    // Passaggio alla frase successiva dopo la dissolvenza in uscita
    const nextSentenceTimer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % ASSO_WORLD_STORY_SENTENCES.length);
    }, readDuration + 800);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(nextSentenceTimer);
    };
  }, [currentIndex, currentSentence.durationMs]);

  return (
    <div
      className={cn(
        'relative flex w-full max-w-4xl flex-col items-center justify-center px-4 text-center',
        className,
      )}
    >
      <div className="min-h-[140px] sm:min-h-[160px] md:min-h-[180px] flex items-center justify-center">
        <p
          role="region"
          aria-live="polite"
          className={cn(
            'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif italic text-amber-50/95 leading-relaxed sm:leading-loose tracking-wide select-none',
            'transition-all duration-1000 ease-in-out',
            isVisible
              ? 'opacity-100 translate-y-0 scale-100 blur-0 drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]'
              : 'opacity-0 -translate-y-2 scale-[0.98] blur-[2px] pointer-events-none',
          )}
          style={{
            fontFamily:
              "'Georgia', 'Cambria', 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
            textShadow:
              '0 2px 4px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.95)',
          }}
        >
          {currentSentence.text}
        </p>
      </div>

      {/* Indicatori minimi delle frasi (puntini discreti) */}
      <div
        className="mt-4 flex items-center gap-1.5 opacity-60 transition-opacity hover:opacity-100"
        aria-hidden="true"
      >
        {ASSO_WORLD_STORY_SENTENCES.map((sentence, idx) => (
          <button
            key={sentence.id}
            type="button"
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                setCurrentIndex(idx);
              }, 400);
            }}
            title={`Frase ${idx + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              idx === currentIndex
                ? 'w-6 bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]'
                : 'w-1.5 bg-white/30 hover:bg-white/60',
            )}
          />
        ))}
      </div>
    </div>
  );
}
