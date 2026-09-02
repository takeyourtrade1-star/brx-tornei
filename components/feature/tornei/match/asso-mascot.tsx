'use client';

import { cn } from '@/lib/utils';
import {
  ASSO_ACCENTS,
  ASSO_BODY_COL,
  ASSO_EYE_CELLS,
  ASSO_GRID,
} from '@/lib/asso-pixel';

export type AssoMascotVariant = 'guide' | 'judge';

interface AssoMascotProps {
  size?: number;
  active?: boolean;
  variant?: AssoMascotVariant;
  className?: string;
}

/** Sprite React dell'Asso arcade: griglia, palette e occhi sono condivisi col minigioco. */
export function AssoMascot({
  size = 72,
  active = true,
  variant = 'guide',
  className,
}: AssoMascotProps) {
  const bodyCells = ASSO_GRID.flatMap((row, y) =>
    Array.from(row).flatMap((pixel, x) => {
      const color = ASSO_BODY_COL[pixel as keyof typeof ASSO_BODY_COL];
      return color ? [{ x, y, color }] : [];
    }),
  );

  return (
    <span
      className={cn('inline-block shrink-0', active && 'asso-mascot-float', className)}
      style={{ width: size, height: size * (22 / 18) }}
      aria-hidden
    >
      <svg
        viewBox="0 0 18 22"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        className="block"
      >
        <rect x="8" y="0" width="1" height="1" fill={ASSO_ACCENTS.sparkleGold} />
        <rect x="2" y="1" width="1" height="1" fill={ASSO_ACCENTS.sparkleBlue} />
        <rect x="15" y="1" width="1" height="1" fill={ASSO_ACCENTS.sparkleMint} />
        {bodyCells.map(({ x, y, color }) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />
        ))}
        <g className={cn('asso-mascot-eyes', active && 'asso-mascot-eyes--active')}>
          {ASSO_EYE_CELLS.map((cell, index) => (
            <rect
              key={`eye-${index}`}
              x={cell.x}
              y={cell.y}
              width="1"
              height="1"
              fill={'w' in cell && cell.w ? '#ffffff' : ASSO_BODY_COL.M}
            />
          ))}
        </g>
        {variant === 'judge' && (
          <g>
            <g className="asso-mascot-hammer">
              {/* Manico tornito in legno scuro */}
              <rect x="14" y="11" width="1" height="5" fill="#5a310c" />
              <rect x="15" y="10" width="1" height="4" fill="#9c5a24" />
              {/* Testa del martelletto: testata sinistra, fusto in legno, anello d'oro, testata destra */}
              <rect x="12" y="7" width="1" height="3" fill="#3a1c04" />
              <rect x="13" y="6" width="2" height="4" fill="#7a4114" />
              <rect x="15" y="6" width="1" height="4" fill={ASSO_ACCENTS.sparkleGold} />
              <rect x="16" y="6" width="2" height="4" fill="#7a4114" />
              <rect x="18" y="7" width="1" height="3" fill="#3a1c04" />
              {/* Riflesso luce superiore sul fusto */}
              <rect x="13" y="6" width="5" height="1" fill="#ffe2b8" opacity="0.8" />
              {/* Ala di Asso che impugna il manico */}
              <rect x="13" y="13" width="2" height="2" fill="#ef6c00" />
            </g>
            {/* Scintille / flash all'impatto del colpo */}
            <g className="asso-gavel-impact">
              <rect x="18" y="11" width="1" height="1" fill="#ffd24a" />
              <rect x="17" y="13" width="1" height="1" fill="#ffb066" />
              <rect x="16" y="15" width="1" height="1" fill="#ffd24a" />
            </g>
          </g>
        )}
      </svg>
    </span>
  );
}
