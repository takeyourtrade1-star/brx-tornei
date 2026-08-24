'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface GameNavArt {
  src: string;
  width: number;
  height: number;
}

export type GameNavVariant = 'mazzi' | 'partite' | 'amici';

interface GameNavButtonBase {
  label: string;
  ariaLabel: string;
  art: GameNavArt;
  variant: GameNavVariant;
  active?: boolean;
  badge?: number;
  onlineDot?: boolean;
  compact?: boolean;
}

type GameNavButtonProps = GameNavButtonBase &
  ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/** Bottone HUD: l'arte 3D è l'immagine, con press-in e badge. */
export function GameNavButton({
  label,
  ariaLabel,
  art,
  variant,
  active = false,
  badge,
  onlineDot = false,
  compact = false,
  href,
  onClick,
}: GameNavButtonProps) {
  const className = cn(
    'game-nav-btn',
    `game-nav-btn--${variant}`,
    active && 'game-nav-btn--active',
    compact && 'game-nav-btn--compact',
  );

  const inner = (
    <>
      {/* img statico: next/image passa da /_next/image e in produzione non carica. */}
      <img
        src={art.src}
        alt=""
        width={art.width}
        height={art.height}
        className="game-nav-btn-art"
        decoding="async"
      />
      <span className="sr-only">{label}</span>
      {onlineDot && <span className="game-nav-online-pip" />}
      {typeof badge === 'number' && badge > 0 && (
        <span className="game-nav-btn-badge">{badge > 9 ? '9+' : badge}</span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} aria-current={active ? 'page' : undefined} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} aria-pressed={active} className={className}>
      {inner}
    </button>
  );
}
