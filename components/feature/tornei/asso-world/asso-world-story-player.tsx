'use client';

import { useEffect, useMemo, useState } from 'react';
import { ASSO_WORLD_STORY_SENTENCES } from '@/lib/data/asso-world-story';
import { cn } from '@/lib/utils';

interface AssoWorldStoryPlayerProps {
  className?: string;
  onSentenceChange?: (index: number, isFinal: boolean) => void;
  onStoryEnded?: (ended: boolean) => void;
}

const CARD_SUITS = ['♠', '♥', '♦', '♣'] as const;

export function AssoWorldStoryPlayer({
  className,
  onSentenceChange,
  onStoryEnded,
}: AssoWorldStoryPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [sentenceFadingOut, setSentenceFadingOut] = useState(false);
  const [storyEnded, setStoryEnded] = useState(false);

  const isFinal = currentIndex === ASSO_WORLD_STORY_SENTENCES.length - 1;
  const currentSentence =
    ASSO_WORLD_STORY_SENTENCES[currentIndex] ?? ASSO_WORLD_STORY_SENTENCES[0];

  const words = useMemo(() => {
    return currentSentence.text.trim().split(/\s+/);
  }, [currentSentence.text]);

  // Gestione apparizione parola per parola in modo fluido e cadenzato
  useEffect(() => {
    setVisibleWordCount(0);
    setSentenceFadingOut(false);
    setStoryEnded(false);
    onStoryEnded?.(false);

    let wordIdx = 0;
    const wordIntervalMs = isFinal ? 170 : 135;

    const wordTimer = setInterval(() => {
      wordIdx += 1;
      setVisibleWordCount(wordIdx);

      // Tutte le parole della frase corrente sono apparse
      if (wordIdx >= words.length) {
        clearInterval(wordTimer);

        if (isFinal) {
          onSentenceChange?.(currentIndex, true);

          // Passano esattamente 3 secondi: la frase e gli indicatori spariscono
          const finalHoldTimer = setTimeout(() => {
            setStoryEnded(true);
            onStoryEnded?.(true);
          }, 3000);

          return () => clearTimeout(finalHoldTimer);
        } else {
          onSentenceChange?.(currentIndex, false);

          // Pausa di lettura distesa dopo l'apparizione completa
          const pauseTimer = setTimeout(() => {
            setSentenceFadingOut(true);

            // Dissolvenza in uscita e passaggio alla frase successiva
            const nextTimer = setTimeout(() => {
              setCurrentIndex((prev) => prev + 1);
            }, 650);

            return () => clearTimeout(nextTimer);
          }, 2400);

          return () => clearTimeout(pauseTimer);
        }
      }
    }, wordIntervalMs);

    return () => {
      clearInterval(wordTimer);
    };
  }, [currentIndex, isFinal, words.length, onSentenceChange, onStoryEnded]);

  const handleSelectSentence = (idx: number) => {
    setSentenceFadingOut(true);
    setStoryEnded(false);
    onStoryEnded?.(false);
    setTimeout(() => {
      setCurrentIndex(idx);
    }, 280);
  };

  return (
    <div
      className={cn(
        'relative flex w-full max-w-4xl flex-col items-center justify-center px-4 text-center transition-all duration-700 ease-out',
        storyEnded
          ? 'opacity-0 -translate-y-3 scale-95 max-h-0 pointer-events-none overflow-hidden my-0'
          : 'opacity-100 translate-y-0 scale-100 max-h-[400px] my-2',
        className,
      )}
    >
      <div className="min-h-[120px] sm:min-h-[140px] md:min-h-[150px] flex items-center justify-center">
        <p
          role="region"
          aria-live="polite"
          className={cn(
            'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif italic text-amber-50/95 leading-relaxed sm:leading-loose tracking-wide select-none',
            'transition-all duration-700 ease-in-out',
            sentenceFadingOut
              ? 'opacity-0 -translate-y-3 blur-[3px]'
              : 'opacity-100 translate-y-0',
          )}
          style={{
            fontFamily:
              "'Georgia', 'Cambria', 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
            textShadow:
              '0 2px 4px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.95)',
          }}
        >
          {words.map((word, wIdx) => {
            const isShown = wIdx < visibleWordCount;
            const isLatest = wIdx === visibleWordCount - 1;
            return (
              <span
                key={wIdx}
                className={cn(
                  'inline-block mr-[0.26em] transition-all duration-500 ease-out',
                  isShown
                    ? 'opacity-100 translate-y-0 scale-100 blur-0'
                    : 'opacity-0 translate-y-2 scale-95 blur-[3px]',
                  isLatest &&
                    'text-amber-200 drop-shadow-[0_0_14px_rgba(252,211,77,0.9)]',
                )}
              >
                {word}
              </span>
            );
          })}
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
