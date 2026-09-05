'use client';

import { useEffect, useRef } from 'react';
import type { AssoWorldLook } from '../../types/asso-world';
import type { AvatarDirection } from '../avatar/avatar-types';
import { drawDetailedCharacter } from './character';

interface CharacterPreviewProps {
  look: AssoWorldLook;
  direction: AvatarDirection;
  walking: boolean;
  reducedMotion: boolean;
  label: string;
}

/** La stessa illustrazione del mondo, con animazione continua nel guardaroba. */
export function CharacterPreview({ look, direction, walking, reducedMotion, label }: CharacterPreviewProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let raf = 0;
    let previous = -Infinity;
    const render = (now: number) => {
      if (now - previous >= 1000 / 30 && !document.hidden) {
        previous = now;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(5.2, 0, 0, 5.2, canvas.width / 2, canvas.height - 35);
        drawDetailedCharacter(ctx, { x: 0, y: 0, look, direction, walking: walking && !reducedMotion, time: reducedMotion ? 0 : now / 1000 });
      }
      if (!reducedMotion) raf = requestAnimationFrame(render);
    };
    render(performance.now());
    return () => cancelAnimationFrame(raf);
  }, [look, direction, walking, reducedMotion]);
  return <canvas ref={ref} width={260} height={330} role="img" aria-label={label} className="h-48 w-auto max-w-full md:h-72" />;
}
