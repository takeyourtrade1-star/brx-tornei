'use client';

import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { loginAction } from '@/actions/auth';
import { AuthErrorAlert } from '@/components/ui/auth-error-alert';
import {
  AUTH_APPLE_BUTTON,
  AUTH_APPLE_INPUT,
  AUTH_LINK,
  AUTH_MUTED_TEXT,
} from '@/components/layout/auth-styles';
import {
  AUTH_SPLIT_INPUT_CLASS,
  AUTH_SPLIT_LABEL_CLASS,
  AUTH_SPLIT_LINK_CLASS,
} from '@/components/layout/auth-split-styles';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  redirect?: string;
  recoverUrl: string;
  /** Layout split: campi affiancati e CTA compatta. */
  variant?: 'default' | 'landing';
}

/**
 * Unico punto interattivo del login: form client → server action.
 */
export function LoginForm({
  redirect = '',
  recoverUrl,
  variant = 'default',
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isLanding = variant === 'landing';

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

  const inputClass = isLanding ? AUTH_SPLIT_INPUT_CLASS : AUTH_APPLE_INPUT;

  if (isLanding) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <input type="hidden" name="redirect" value={redirect} />
        <input
          type="text"
          name="website_url"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <h2 className="text-[18px] font-semibold text-[#1d1d1f] sm:text-[20px]">Accedi</h2>

        <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] lg:items-end">
          <div>
            <label htmlFor="identifier" className={AUTH_SPLIT_LABEL_CLASS}>
              Email o username
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              disabled={isPending}
              className={inputClass}
            />
          </div>

          <div className="flex items-end gap-3.5 lg:contents">
            <div className="min-w-0 flex-1">
              <label htmlFor="password" className={AUTH_SPLIT_LABEL_CLASS}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isPending}
                  className={cn(inputClass, 'pr-11')}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#86868b] transition-colors hover:text-[#1d1d1f]"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              aria-label="Accedi"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-global text-white shadow-[0_3px_10px_rgba(61,101,198,0.28)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <LogIn className="h-5 w-5" strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href={codeHref} className={`text-[14px] ${AUTH_SPLIT_LINK_CLASS}`}>
            Accedi con codice monouso
          </Link>
          <a href={recoverUrl} className={`text-[14px] ${AUTH_SPLIT_LINK_CLASS}`}>
            Recupera credenziali
          </a>
        </div>

        <AuthErrorAlert message={error} />

        <div className="border-t border-gray-200/60 pt-4 text-center">
          <p className="text-[14px] font-medium text-[#515154]">Non hai un account?</p>
          <Link
            href="/registrati"
            className="mx-auto mt-3 inline-flex min-w-[11rem] justify-center rounded-full bg-gradient-global px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_3px_10px_rgba(61,101,198,0.28)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            Registrati
          </Link>
        </div>
      </form>
    );
  }

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
