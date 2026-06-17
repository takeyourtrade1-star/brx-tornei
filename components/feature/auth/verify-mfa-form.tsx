'use client';

import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { verifyMfaAction } from '@/actions/auth';
import { AuthErrorAlert } from '@/components/ui/auth-error-alert';
import { Checkbox } from '@/components/ui/checkbox';
import { OtpSixBoxes } from '@/components/ui/otp-six-boxes';
import {
  AUTH_APPLE_BUTTON,
  AUTH_LINK,
} from '@/components/layout/auth-styles';

interface VerifyMfaFormProps {
  redirect?: string;
}

export function VerifyMfaForm({ redirect = '' }: VerifyMfaFormProps) {
  const [mfaCode, setMfaCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mfaCode.length !== 6) {
      setError('Il codice MFA deve essere di 6 cifre');
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set('mfa_code', mfaCode);
    setError(null);

    startTransition(async () => {
      const result = await verifyMfaAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  const loginHref = redirect
    ? `/login?accesso=1&redirect=${encodeURIComponent(redirect)}`
    : '/login?accesso=1';

  return (
    <>
      <Link
        href={loginHref}
        className="mb-6 flex items-center gap-1 self-start text-[13px] font-medium text-[#86868b] transition-colors hover:text-[#1d1d1f]"
      >
        <ArrowLeft className="h-4 w-4" /> Indietro
      </Link>

      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/5">
          <Shield className="h-7 w-7 text-[#1d1d1f]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[#1d1d1f] sm:text-[32px]">
            Verifica in due passaggi
          </h1>
          <p className="mt-1.5 text-[14px] text-[#86868b]">
            Inserisci il codice a 6 cifre dalla tua app di autenticazione.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="redirect" value={redirect} />
        {rememberDevice && (
          <input type="hidden" name="remember_device" value="on" />
        )}

        <div className="space-y-3">
          <p className="text-center text-[12px] font-semibold uppercase tracking-wide text-[#86868b]">
            Codice di verifica
          </p>

          <OtpSixBoxes
            value={mfaCode}
            onChange={setMfaCode}
            disabled={isPending}
            error={mfaCode.length > 0 && mfaCode.length < 6 ? '6 cifre richieste' : undefined}
          />

          <div className="flex items-center gap-2.5 pt-1">
            <Checkbox
              id="remember-device"
              checked={rememberDevice}
              onCheckedChange={setRememberDevice}
              disabled={isPending}
            />
            <label
              htmlFor="remember-device"
              className="cursor-pointer select-none text-[13px] leading-none text-[#515154]"
            >
              Ricorda questo dispositivo
            </label>
          </div>
        </div>

        <AuthErrorAlert message={error} />

        <div className="space-y-3 pt-2">
          <button type="submit" disabled={isPending || mfaCode.length !== 6} className={AUTH_APPLE_BUTTON}>
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Verifica in corso…
              </span>
            ) : (
              'Verifica'
            )}
          </button>

          <Link
            href={loginHref}
            className="group flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#86868b] transition-colors hover:text-[#1d1d1f]"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Torna al login
          </Link>
        </div>
      </form>

      <p className="mt-8 text-center text-[12px] text-[#86868b]">
        Problemi con MFA? Contatta{' '}
        <a href="mailto:ebartex.service@gmail.com" className={AUTH_LINK}>
          ebartex.service@gmail.com
        </a>
      </p>
    </>
  );
}
