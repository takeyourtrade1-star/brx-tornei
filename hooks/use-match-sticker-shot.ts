'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MatchSticker } from '@/components/feature/tornei/match/match-stickers';

export interface StickerShot {
  sticker: MatchSticker;
  fromUserId: string;
  key: number;
}

export function useMatchStickerShot() {
  const [stickerShot, setStickerShot] = useState<StickerShot | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = useRef(0);

  const handleSticker = useCallback((sticker: MatchSticker, fromUserId: string) => {
    key.current += 1;
    setStickerShot({ sticker, fromUserId, key: key.current });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStickerShot(null), 2_200);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { stickerShot, handleSticker };
}
