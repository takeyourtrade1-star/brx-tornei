'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { loginAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginFormProps {
  /** Pagina dedicata (redirect server) o modal (resta sulla pagina corrente). */
  variant?: 'page' | 'modal';
  onSuccess?: () => void;
}

/**
 * Unico punto interattivo dell'auth: form client → server action.
 * Lo stato è limitato a errore + pending; i token non toccano mai il client.
 */
export function LoginForm({ variant = 'page', onSuccess }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isModal = variant === 'modal';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
      if (result?.success) onSuccess?.();
      // In caso di successo senza stayOnPage, loginAction fa redirect('/hub').
    });
  }

  const form = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {isModal && <input type="hidden" name="stayOnPage" value="true" />}
      <Input
        name="identifier"
        type="text"
        placeholder="Email o username"
        autoComplete="username"
        required
        disabled={isPending}
      />
      <Input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        disabled={isPending}
      />
      {/* Honeypot anti-bot (stesso meccanismo di Ebartex): nascosto, deve restare vuoto */}
      <input
        type="text"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Accesso in corso…' : 'Accedi'}
      </Button>
    </form>
  );

  if (isModal) {
    return form;
  }

  return (
    <Card className="brx-glass-light animate-auth-enter rounded-3xl border-2 border-white">
      <CardHeader>
        <CardTitle className="text-center text-foreground">Accedi</CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
