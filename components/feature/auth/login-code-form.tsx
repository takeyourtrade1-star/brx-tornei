'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition, type FormEvent } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { requestLoginCodeAction, verifyLoginCodeAction } from '@/actions/auth';
import { EmailCodeInput } from '@/components/auth/email-code-input';
import { AuthErrorAlert } from '@/components/ui/auth-error-alert';
import { AuthSplitHeader } from '@/components/layout/AuthSplitHeader';
import {
  AUTH_APPLE_BUTTON,
  AUTH_APPLE_INPUT,
  AUTH_LINK,
  AUTH_MUTED_TEXT,
} from '@/components/layout/auth-styles';
import {
  AUTH_LINK_CLASS,
  AUTH_SPLIT_BODY_CLASS,
  AUTH_SPLIT_BUTTON_CLASS,
  AUTH_SPLIT_CAPTION_CLASS,
  AUTH_SPLIT_FORM_CLASS,
  AUTH_SPLIT_INPUT_CLASS,
  AUTH_SPLIT_MUTED_CLASS,
} from '@/components/layout/auth-split-styles';

interface LoginCodeFormProps {
  redirect?: string;
  variant?: 'default' | 'split';
}

export function LoginCodeForm({ redirect = '', variant = 'default' }: LoginCodeFormProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isSplit = variant === 'split';

  const loginHref = redirect
    ? `/login?accesso=1&redirect=${encodeURIComponent(redirect)}`
    : '/login?accesso=1';

  useEffect(() => {
    if (step !== 'verify') return;
    setCountdown(300);
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formattedCountdown = useMemo(() => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [countdown]);

  const handleRequest = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setError(null);
      startTransition(async () => {
        const result = await requestLoginCodeAction(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        setEmail(String(formData.get('email') ?? '').trim().toLowerCase());
        setStep('verify');
        setCode('');
      });
    },
    [startTransition]
  );

  const handleVerify = useCallback(
    (event?: FormEvent<HTMLFormElement>, codeOverride?: string) => {
      event?.preventDefault();
      const codeToSend = codeOverride ?? code;
      if (codeToSend.length !== 8) {
        setError('Il codice deve essere di 8 caratteri');
        return;
      }

      const formData = new FormData();
      formData.set('email', email);
      formData.set('code', codeToSend);
      formData.set('redirect', redirect);
      setError(null);

      startTransition(async () => {
        const result = await verifyLoginCodeAction(formData);
        if (result?.error) setError(result.error);
      });
    },
    [code, email, redirect, startTransition]
  );

  const handleResend = useCallback(() => {
    if (!email || countdown > 0) return;
    const formData = new FormData();
    formData.set('email', email);
    formData.set('redirect', redirect);
    setError(null);
    startTransition(async () => {
      const result = await requestLoginCodeAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setCountdown(300);
    });
  }, [countdown, email, redirect, startTransition]);

  if (isSplit) {
    return (
      <>
        <AuthSplitHeader
          title="Accedi con codice"
          subtitle={
            step === 'request'
              ? 'Inserisci la tua email per ricevere un codice monouso.'
              : 'Controlla la posta e inserisci il codice a 8 caratteri.'
          }
          className="mb-0 shrink-0"
        />

        <AuthErrorAlert message={error} className="mt-4" />

        {step === 'request' ? (
          <form onSubmit={handleRequest} className={`${AUTH_SPLIT_FORM_CLASS} mt-4`}>
            <input type="hidden" name="redirect" value={redirect} />
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="La tua email"
              required
              disabled={isPending}
              className={AUTH_SPLIT_INPUT_CLASS}
            />
            <button type="submit" disabled={isPending} className={AUTH_SPLIT_BUTTON_CLASS}>
              {isPending ? 'Invio in corso…' : 'Invia codice'}
            </button>
          </form>
        ) : (
          <div className={`${AUTH_SPLIT_FORM_CLASS} mt-4`}>
            <div className="space-y-2.5">
              <p className={AUTH_SPLIT_CAPTION_CLASS}>Codice monouso</p>
              <p className={AUTH_SPLIT_MUTED_CLASS}>
                Abbiamo inviato un codice a{' '}
                <span className="font-medium text-[#1d1d1f]">{email}</span>
              </p>

              <EmailCodeInput
                value={code}
                onChange={setCode}
                onComplete={(value) => handleVerify(undefined, value)}
                disabled={isPending}
              />

              <p className={AUTH_SPLIT_MUTED_CLASS}>
                {countdown > 0 ? `⏳ ${formattedCountdown}` : 'Puoi richiedere un nuovo codice'}
              </p>
            </div>

            <div className="flex items-center justify-start gap-1.5">
              <span className={AUTH_SPLIT_BODY_CLASS}>Non l&apos;hai ricevuto?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isPending || countdown > 0}
                className={`text-[13px] ${AUTH_LINK_CLASS} disabled:opacity-50 disabled:hover:no-underline`}
              >
                Reinvia codice
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleVerify(undefined, code)}
              disabled={isPending || code.length !== 8}
              className={AUTH_SPLIT_BUTTON_CLASS}
            >
              {isPending ? 'Accesso in corso…' : 'Accedi'}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Link
        href={loginHref}
        className="mb-5 flex items-center gap-1 self-start text-[12px] font-medium text-[#86868b] transition-colors hover:text-[#1d1d1f]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Torna al login
      </Link>

      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/5">
          <Mail className="h-6 w-6 text-[#1d1d1f]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[#1d1d1f]">
            Accedi con codice
          </h1>
          <p className="mt-1 text-[13px] text-[#86868b]">
            {step === 'request'
              ? 'Inserisci la tua email per ricevere un codice monouso.'
              : 'Controlla la posta e inserisci il codice a 8 caratteri.'}
          </p>
        </div>
      </div>

      <AuthErrorAlert message={error} className="mb-4" />

      {step === 'request' ? (
        <form onSubmit={handleRequest} className="space-y-4">
          <input type="hidden" name="redirect" value={redirect} />
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="La tua email"
            required
            disabled={isPending}
            className={AUTH_APPLE_INPUT}
          />
          <button type="submit" disabled={isPending} className={AUTH_APPLE_BUTTON}>
            {isPending ? 'Invio in corso…' : 'Invia codice'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-3">
            <p className="text-center text-[10px] font-medium tracking-wide text-[#86868b]/80">
              Codice monouso
            </p>
            <p className="text-center text-[12px] leading-relaxed text-[#86868b]">
              Abbiamo inviato un codice a <span className="font-medium text-[#1d1d1f]">{email}</span>
            </p>
            <EmailCodeInput
              value={code}
              onChange={setCode}
              onComplete={(value) => handleVerify(undefined, value)}
              disabled={isPending}
            />
            <p className="text-center text-[12px] text-[#86868b]">
              {countdown > 0 ? `⏳ ${formattedCountdown}` : 'Puoi richiedere un nuovo codice'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[12px] text-[#515154]">Non l&apos;hai ricevuto?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isPending || countdown > 0}
              className={`text-[12px] disabled:opacity-50 disabled:hover:no-underline ${AUTH_LINK}`}
            >
              Reinvia codice
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending || code.length !== 8}
            className={AUTH_APPLE_BUTTON}
          >
            {isPending ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-gray-200/50 pt-4 text-center">
        <p className={AUTH_MUTED_TEXT}>
          Non hai un account?{' '}
          <Link href="/registrati" className={`text-[14px] font-semibold ${AUTH_LINK}`}>
            Registrati
          </Link>
        </p>
      </div>
    </>
  );
}
