import type { CSSProperties } from 'react';
import { ASSO_ACCENTS, ASSO_BODY_COL, ASSO_GH, ASSO_GRID, ASSO_GW } from '@/lib/asso-pixel';
import { cn } from '@/lib/utils';

export interface AssoPixelProps {
  readonly className?: string;
  readonly label?: string;
  readonly style?: CSSProperties;
}

const PIXEL_COLORS: Readonly<Record<string, string>> = {
  ...ASSO_BODY_COL,
  y: ASSO_ACCENTS.sparkleGold,
  b: ASSO_ACCENTS.sparkleBlue,
  g: ASSO_ACCENTS.sparkleMint,
  k: ASSO_ACCENTS.shadow,
};

export function AssoPixel({ className, label, style }: AssoPixelProps): React.JSX.Element {
  return (
    <span
      className={cn('relative grid shrink-0', className)}
      style={{
        aspectRatio: `${ASSO_GW} / ${ASSO_GH}`,
        gridTemplateColumns: `repeat(${ASSO_GW}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${ASSO_GH}, minmax(0, 1fr))`,
        ...style,
      }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {ASSO_GRID.flatMap((row, rowIndex) =>
        Array.from(row).map((cell, columnIndex) => {
          if (cell === '.') return null;
          return (
            <i
              key={`${rowIndex}-${columnIndex}`}
              className="block h-full w-full"
              style={{
                gridColumn: columnIndex + 1,
                gridRow: rowIndex + 1,
                backgroundColor: PIXEL_COLORS[cell] || 'transparent',
              }}
            />
          );
        }),
      )}
    </span>
  );
}
