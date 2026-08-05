'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthErrorAlertProps {
  message: string | null;
  className?: string;
}

/** Alert errori auth — versione leggera allineata al design Ebartex. */
export function AuthErrorAlert({ message, className }: AuthErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        'animate-auth-enter rounded-2xl border border-destructive/25 bg-destructive/5 p-3.5',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[13px] font-semibold text-destructive">Accesso non riuscito</p>
          <p className="mt-0.5 text-[13px] text-destructive/80">{message}</p>
        </div>
      </div>
    </div>
  );
}
