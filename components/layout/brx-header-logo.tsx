import Link from 'next/link';
import Image from 'next/image';
import {
  HEADER_BRX_LOGO_COLUMN_CLASS,
  HEADER_BRX_LOGO_DARK_SRC,
  HEADER_BRX_LOGO_IMAGE_CLASS,
  HEADER_BRX_LOGO_INTRINSIC_HEIGHT,
  HEADER_BRX_LOGO_INTRINSIC_WIDTH,
  HEADER_BRX_LOGO_LINK_CLASS,
} from '@/components/layout/header-brx-column';

interface BrxHeaderLogoProps {
  href?: string;
  ariaLabel?: string;
}

/** Logo principale Ebartex nell'header — stesso asset della landing Ebartex. */
export function BrxHeaderLogo({ href = '/', ariaLabel = 'Home' }: BrxHeaderLogoProps) {
  return (
    <div className={HEADER_BRX_LOGO_COLUMN_CLASS}>
      <Link href={href} className={HEADER_BRX_LOGO_LINK_CLASS} aria-label={ariaLabel}>
        <Image
          src={HEADER_BRX_LOGO_DARK_SRC}
          alt="Ebartex"
          width={HEADER_BRX_LOGO_INTRINSIC_WIDTH}
          height={HEADER_BRX_LOGO_INTRINSIC_HEIGHT}
          className={HEADER_BRX_LOGO_IMAGE_CLASS}
          priority
          unoptimized
        />
      </Link>
    </div>
  );
}
