'use client';

import { useEffect, useState } from 'react';
import { ASSO_WORLD_STORY_SENTENCES } from '@/lib/data/asso-world-story';
import { cn } from '@/lib/utils';

interface AssoWorldStoryPlayerProps {
  className?: string;
  onSentenceChange?: (index: number, isFinal: boolean) => void;
}

const CARD_SUITS = ['♠', '♥', '♦', '♣'] as const;

export function AssoWorldStoryPlayer({
  className,
  onSentenceChange,
}: AssoWorldStoryPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const isFinal = currentIndex === ASSO_WORLD_STORY_SENTENCES.length - 1;
  const currentSentence =
    ASSO_WORLD_STORY_SENTENCES[currentIndex] ?? ASSO_WORLD_STORY_SENTENCES[0];

  useEffect(() => {
    onSentenceChange?.(currentIndex, isFinal);
  }, [currentIndex, isFinal, onSentenceChange]);

  useEffect(() => {
    // Entrata dolce
    const enterTimer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    // Se è la frase finale, NON scompare e NON si ripete la storia
    if (isFinal) {
      return () => clearTimeout(enterTimer);
    }

    const readDuration = currentSentence.durationMs ?? 4500;

    // Dissolvenza in uscita dopo il tempo di lettura
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, readDuration);

    // Passaggio alla frase successiva
    const nextSentenceTimer = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, readDuration + 700);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(nextSentenceTimer);
    };
  }, [currentIndex, isFinal, currentSentence.durationMs]);

  const handleSelectSentence = (idx: number) => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentIndex(idx);
    }, 300);
  };

  return (
    <div
      className={cn(
        'relative flex w-full max-w-4xl flex-col items-center justify-center px-4 text-center',
        className,
      )}
    >
      <div className="min-h-[120px] sm:min-h-[140px] md:min-h-[150px] flex items-center justify-center">
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

      {/* Indicatore tematico a mini carte da gioco */}
      <div
        className="mt-6 flex items-center gap-2.5 sm:gap-3 opacity-80 transition-opacity hover:opacity-100"
        aria-label="Capitoli della storia"
      >
        {ASSO_WORLD_STORY_SENTENCES.map((sentence, idx) => {
          const isActive = idx === currentIndex;
          const isPassed = idx < currentIndex;
          const suit = CARD_SUITS[idx % CARD_SUITS.length];
          const isRed = suit === '♥' || suit === '♦';

          return (
            <button
              key={sentence.id}
              type="button"
              onClick={() => handleSelectSentence(idx)}
              title={`Capitolo ${idx + 1}`}
              className={cn(
                'group relative flex flex-col items-center justify-between rounded-[4px] p-0.5 sm:p-1 transition-all duration-500',
                'w-5 h-7 sm:w-6 sm:h-9 border',
                isActive
                  ? 'border-amber-300 bg-amber-400/20 scale-110 -translate-y-1 shadow-[0_0_14px_rgba(252,211,77,0.7)]'
                  : isPassed
                    ? 'border-amber-400/40 bg-amber-500/10 hover:border-amber-300/70 hover:scale-105'
                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:scale-105',
              )}
            >
              <span
                className={cn(
                  'text-[9px] sm:text-[11px] font-black leading-none select-none transition-colors',
                  isActive
                    ? 'text-amber-300'
                    : isRed
                      ? 'text-rose-400/80'
                      : 'text-white/70',
                )}
              >
                {suit}
              </span>
              <span
                className={cn(
                  'text-[7px] sm:text-[8px] font-mono font-bold leading-none select-none',
                  isActive ? 'text-amber-200' : 'text-white/40',
                )}
              >
                {idx + 1}
              </span>
              <span
                className={cn(
                  'absolute inset-[1px] rounded-[3px] border pointer-events-none transition-colors',
                  isActive
                    ? 'border-amber-300/40'
                    : 'border-transparent group-hover:border-white/15',
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
