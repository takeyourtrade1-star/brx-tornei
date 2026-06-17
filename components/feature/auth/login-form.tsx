'use client';

import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { loginAction } from '@/actions/auth';
import { AuthErrorAlert } from '@/components/ui/auth-error-alert';
import {
  AUTH_APPLE_BUTTON,
  AUTH_APPLE_INPUT,
  AUTH_LINK,
  AUTH_MUTED_TEXT,
} from '@/components/layout/auth-styles';

interface LoginFormProps {
  redirect?: string;
  recoverUrl: string;
}

/**
 * Unico punto interattivo del login: form client → server action.
 * Design Apple allineato a new_frontend_brx.
 */
export function LoginForm({ redirect = '', recoverUrl }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  const codeHref = redirect
    ? `/login/code?redirect=${encodeURIComponent(redirect)}`
    : '/login/code';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="redirect" value={redirect} />
      <input
        type="text"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <input
          name="identifier"
          type="text"
          placeholder="Email o username"
          autoComplete="username"
          required
          disabled={isPending}
          className={AUTH_APPLE_INPUT}
        />
      </div>

      <div>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            autoComplete="current-password"
            required
            disabled={isPending}
            className={`${AUTH_APPLE_INPUT} pr-11`}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#86868b] transition-colors hover:text-[#1d1d1f]"
            aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <a href={recoverUrl} className={`text-[13px] ${AUTH_LINK}`}>
          Recupera credenziali
        </a>
      </div>

      <AuthErrorAlert message={error} />

      <div className="pt-2">
        <button type="submit" disabled={isPending} className={AUTH_APPLE_BUTTON}>
          {isPending ? 'Accesso in corso…' : 'Accedi'}
        </button>
      </div>

      <p className={`pt-1 text-center ${AUTH_MUTED_TEXT}`}>
        <Link href={codeHref} className={AUTH_LINK}>
          Accedi con codice monouso
        </Link>
      </p>
    </form>
  );
}
