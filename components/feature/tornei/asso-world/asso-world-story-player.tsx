'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FastForward, RotateCcw, Sparkles } from 'lucide-react';
import {
  ASSO_WORLD_STORY_SEGMENTS,
  getStoryWordTokens,
  type StoryWordToken,
} from '@/lib/data/asso-world-story';
import { cn } from '@/lib/utils';

const WORD_REVEAL_INTERVAL_MS = 75;

interface AssoWorldStoryPlayerProps {
  className?: string;
  onStoryComplete?: () => void;
}

export function AssoWorldStoryPlayer({
  className,
  onStoryComplete,
}: AssoWorldStoryPlayerProps) {
  const tokens = useMemo(() => getStoryWordTokens(), []);
  const [revealedCount, setRevealedCount] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  const isComplete = revealedCount >= tokens.length;

  useEffect(() => {
    if (isComplete) {
      onStoryComplete?.();
      return undefined;
    }

    const timer = setInterval(() => {
      setRevealedCount((prev) => {
        const next = prev + 1;
        if (next >= tokens.length) {
          clearInterval(timer);
          onStoryComplete?.();
          return tokens.length;
        }
        return next;
      });
    }, WORD_REVEAL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isComplete, onStoryComplete, tokens.length]);

  // Scorrimento morbido per seguire l'ultima parola apparsa
  useEffect(() => {
    if (activeWordRef.current && !isComplete) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [revealedCount, isComplete]);

  const handleSkip = () => {
    setRevealedCount(tokens.length);
    onStoryComplete?.();
  };

  const handleRestart = () => {
    setRevealedCount(1);
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleTokens = useMemo(
    () => tokens.slice(0, revealedCount),
    [tokens, revealedCount],
  );

  // Raggruppa le parole visibili per segmento per mantenere la spaziatura in paragrafi
  const visibleSegments = useMemo(() => {
    const grouped = new Map<string, StoryWordToken[]>();
    for (const token of visibleTokens) {
      const list = grouped.get(token.segmentId) ?? [];
      list.push(token);
      grouped.set(token.segmentId, list);
    }
    return ASSO_WORLD_STORY_SEGMENTS.filter((seg) => grouped.has(seg.id)).map(
      (seg) => ({
        ...seg,
        tokens: grouped.get(seg.id) ?? [],
      }),
    );
  }, [visibleTokens]);

  return (
    <div className={cn('relative flex flex-col', className)}>
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-white/60">
        <div className="flex items-center gap-1.5 font-medium tracking-wide">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span className="uppercase text-[11px] tracking-widest text-amber-300 font-bold">
            La visione di Ebartex
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isComplete ? (
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <FastForward className="h-3 w-3" />
              <span>Mostra tutto</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Rileggi</span>
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        role="region"
        aria-label="Fiaba Asso World"
        aria-live="polite"
        className="scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent max-h-[38vh] sm:max-h-[44vh] md:max-h-[48vh] overflow-y-auto pr-2 space-y-3.5 text-left"
      >
        {visibleSegments.map((segment) => {
          if (segment.isHeading) {
            return (
              <h3
                key={segment.id}
                className="font-display text-base sm:text-lg md:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-yellow-300"
              >
                {segment.tokens.map((token) => {
                  const isLatest =
                    token.index === revealedCount - 1 && !isComplete;
                  return (
                    <span
                      key={token.index}
                      ref={isLatest ? activeWordRef : undefined}
                      className={cn(
                        'inline-block mr-[0.25em] transition-opacity duration-200',
                        isLatest && 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]',
                      )}
                    >
                      {token.word}
                    </span>
                  );
                })}
              </h3>
            );
          }

          return (
            <p
              key={segment.id}
              className="text-xs sm:text-sm md:text-base leading-relaxed sm:leading-loose text-white/90 font-sans"
            >
              {segment.tokens.map((token) => {
                const isLatest =
                  token.index === revealedCount - 1 && !isComplete;
                return (
                  <span
                    key={token.index}
                    ref={isLatest ? activeWordRef : undefined}
                    className={cn(
                      'inline-block mr-[0.25em] transition-opacity duration-200',
                      isLatest && 'text-amber-200 font-semibold drop-shadow-[0_0_6px_rgba(253,230,138,0.7)]',
                    )}
                  >
                    {token.word}
                  </span>
                );
              })}
              {!isComplete &&
                segment.tokens[segment.tokens.length - 1]?.index ===
                  revealedCount - 1 && (
                  <span
                    aria-hidden="true"
                    className="inline-block h-3.5 w-1.5 align-middle bg-amber-400 animate-pulse ml-0.5 rounded-sm"
                  />
                )}
            </p>
          );
        })}
      </div>
    </div>
  );
}
