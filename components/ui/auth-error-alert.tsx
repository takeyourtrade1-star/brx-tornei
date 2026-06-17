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
        'animate-auth-enter rounded-2xl border border-red-100 bg-gradient-to-br from-red-500/10 via-red-400/5 to-orange-400/10 p-3.5 shadow-red-500/10',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600">
          <AlertCircle className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[13px] font-semibold text-red-600">Accesso non riuscito</p>
          <p className="mt-0.5 text-[13px] text-red-600/90">{message}</p>
        </div>
      </div>
    </div>
  );
}
