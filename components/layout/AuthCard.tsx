import type { ReactNode } from 'react';
import { AUTH_APPLE_CARD, AUTH_TITLE } from '@/components/layout/auth-styles';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  header?: ReactNode;
}

/** Card Apple-style condivisa tra login, MFA e codice monouso. */
export function AuthCard({ title, children, className, header }: AuthCardProps) {
  return (
    <div className={cn(AUTH_APPLE_CARD, className)}>
      <div className="flex flex-col p-8 sm:p-10">
        {header}
        {title && <h1 className={cn(AUTH_TITLE, header ? 'mb-6' : 'mb-8')}>{title}</h1>}
        {children}
      </div>
    </div>
  );
}
