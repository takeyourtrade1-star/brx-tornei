import Link from 'next/link';
import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';
import {
  HEADER_BRX_LOGO_COLUMN_CLASS,
  HEADER_BRX_LOGO_IMAGE_CLASS,
  HEADER_BRX_LOGO_LINK_CLASS,
  HEADER_BRX_LOGO_PATH,
} from '@/components/layout/header-brx-column';

interface BrxHeaderLogoProps {
  href?: string;
  ariaLabel?: string;
}

/** Logo corto BRX nell'header — allineato a new_frontend_brx TopBar. */
export function BrxHeaderLogo({ href = '/', ariaLabel = 'Home' }: BrxHeaderLogoProps) {
  return (
    <div className={HEADER_BRX_LOGO_COLUMN_CLASS}>
      <Link href={href} className={HEADER_BRX_LOGO_LINK_CLASS} aria-label={ariaLabel}>
        <Image
          src={getCdnImageUrl(HEADER_BRX_LOGO_PATH)}
          alt="BRX"
          width={240}
          height={120}
          className={HEADER_BRX_LOGO_IMAGE_CLASS}
          priority
          unoptimized
        />
      </Link>
    </div>
  );
}
