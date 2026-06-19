'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AuthBackLinkProps {
  href?: string;
  label?: string;
  onClick?: () => void;
}

export function AuthBackLink({ href = '/login', label = 'Indietro', onClick }: AuthBackLinkProps) {
  const className =
    'mb-4 flex items-center gap-1 self-start text-[14px] font-medium text-[#86868b] transition-colors hover:text-[#1d1d1f]';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
