'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type GameNavTone = 'orange' | 'gold' | 'blue';

interface GameNavButtonBase {
  label: string;
  ariaLabel: string;
  icon: ComponentType<{ className?: string }>;
  tone: GameNavTone;
  active?: boolean;
  badge?: number;
  onlineDot?: boolean;
  compact?: boolean;
}

type GameNavButtonProps = GameNavButtonBase &
  ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/** Bottone HUD 3D stile arcade: estrusione, highlight e schiacciata al tap. */
export function GameNavButton({
  label,
  ariaLabel,
  icon: Icon,
  tone,
  active = false,
  badge,
  onlineDot = false,
  compact = false,
  href,
  onClick,
}: GameNavButtonProps) {
  const className = cn(
    'game-nav-btn',
    `game-nav-btn--${tone}`,
    active && 'game-nav-btn--active',
    compact && 'game-nav-btn--compact',
  );

  const inner = (
    <>
      <span className="game-nav-btn-icon-wrap">
        <span className="game-nav-btn-icon">
          <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
        </span>
        {onlineDot && <span className="game-nav-online-pip" />}
      </span>
      <span className="game-nav-btn-label">{label}</span>
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
