'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface GameNavArt {
  src: string;
  width: number;
  height: number;
}

interface GameNavButtonBase {
  label: string;
  ariaLabel: string;
  art: GameNavArt;
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
  active = false,
  badge,
  onlineDot = false,
  compact = false,
  href,
  onClick,
}: GameNavButtonProps) {
  const className = cn(
    'game-nav-btn',
    active && 'game-nav-btn--active',
    compact && 'game-nav-btn--compact',
  );

  const inner = (
    <>
      <Image
        src={art.src}
        alt=""
        width={art.width}
        height={art.height}
        className="game-nav-btn-art"
        sizes={compact ? '108px' : '176px'}
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
