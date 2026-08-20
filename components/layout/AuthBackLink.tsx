'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AuthBackLinkProps {
  href?: string;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export function AuthBackLink({
  href = '/login',
  label = 'Indietro',
  className: customClassName,
  onClick,
}: AuthBackLinkProps) {
  const baseClassName =
    'mb-4 inline-flex items-center gap-1.5 self-start text-[14px] font-medium text-[#86868b] transition-colors hover:text-[#1d1d1f]';
  const className = customClassName ? `${baseClassName} ${customClassName}` : baseClassName;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {label}
      </button>
    );
  }

  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  if (isExternal) {
    return (
      <a href={href} className={className}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
