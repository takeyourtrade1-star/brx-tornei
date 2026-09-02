import Link from 'next/link';
import Image from 'next/image';
import {
  HEADER_BRX_LOGO_COLUMN_CLASS,
  HEADER_BRX_LOGO_COLUMN_COMPACT_CLASS,
  HEADER_BRX_LOGO_DARK_SRC,
  HEADER_BRX_LOGO_IMAGE_CLASS,
  HEADER_BRX_LOGO_IMAGE_COMPACT_CLASS,
  HEADER_BRX_LOGO_INTRINSIC_HEIGHT,
  HEADER_BRX_LOGO_INTRINSIC_WIDTH,
  HEADER_BRX_LOGO_LINK_CLASS,
  HEADER_BRX_LOGO_SRC,
} from '@/components/layout/header-brx-column';

interface BrxHeaderLogoProps {
  href?: string;
  ariaLabel?: string;
  variant?: 'dark' | 'light';
  size?: 'default' | 'compact';
  /** false = solo il marchio, per inserirlo in un Link padre. */
  linked?: boolean;
}

/** Logo principale Ebartex nell'header — stesso asset della landing Ebartex. */
export function BrxHeaderLogo({
  href = '/',
  ariaLabel = 'Home',
  size = 'default',
  linked = true,
}: BrxHeaderLogoProps) {
  const src = HEADER_BRX_LOGO_SRC;
  const compact = size === 'compact';
  const image = (
    <Image
      src={src}
      alt="Ebartex"
      width={HEADER_BRX_LOGO_INTRINSIC_WIDTH}
      height={HEADER_BRX_LOGO_INTRINSIC_HEIGHT}
      className={compact ? HEADER_BRX_LOGO_IMAGE_COMPACT_CLASS : HEADER_BRX_LOGO_IMAGE_CLASS}
      priority
      unoptimized
    />
  );

  return (
    <div className={compact ? HEADER_BRX_LOGO_COLUMN_COMPACT_CLASS : HEADER_BRX_LOGO_COLUMN_CLASS}>
      {linked ? (
        <Link href={href} className={HEADER_BRX_LOGO_LINK_CLASS} aria-label={ariaLabel}>
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  );
}
