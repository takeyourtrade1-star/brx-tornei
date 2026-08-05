'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { checkGamertagAvailabilityAction, setGamertagAction } from '@/actions/players';
import type { GamertagAvailability } from '@/lib/data/player-api-client';

interface SetGamertagViewProps {
  initialGamertag: string | null;
  redirectTo: string;
}

export function SetGamertagView({ initialGamertag, redirectTo }: SetGamertagViewProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialGamertag ?? '');
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<GamertagAvailability | null>(null);
  const [, startChecking] = useTransition();
  const [saving, startSaving] = useTransition();

  function handleChange(next: string) {
    setValue(next);
    setError(null);
    const trimmed = next.trim();
    if (trimmed.length < 3 || trimmed === (initialGamertag ?? '')) {
      setAvailability(null);
      return;
    }
    startChecking(async () => {
      const result = await checkGamertagAvailabilityAction(trimmed);
      setAvailability(result);
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startSaving(async () => {
      const result = await setGamertagAction(value);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  }

  const trimmed = value.trim();
  const unchanged = trimmed.length > 0 && trimmed === (initialGamertag ?? '');
  const showAvailability = !unchanged && trimmed.length >= 3 && availability !== null;
  const canSubmit =
    trimmed.length >= 3 && trimmed.length <= 20 && !saving && (unchanged || availability?.available === true);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Scegli il tuo gamertag</CardTitle>
          <CardDescription>
            Lo pseudonimo che gli altri giocatori vedranno ai tavoli dei tornei. Puoi cambiarlo
            quando vuoi.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            <Input
              autoFocus
              value={value}
              onChange={(event) => handleChange(event.target.value)}
              placeholder="Es. DragoBlu92"
              maxLength={20}
              aria-label="Gamertag"
            />
            <p className="text-xs text-muted-foreground">
              3-20 caratteri: lettere, numeri e underscore.
            </p>
            {showAvailability && (
              <p
                className={
                  availability?.validFormat && availability.available
                    ? 'text-xs text-emerald-600'
                    : 'text-xs text-destructive'
                }
              >
                {!availability?.validFormat
                  ? 'Formato non valido.'
                  : availability.available
                    ? 'Disponibile.'
                    : 'Gamertag già in uso.'}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!canSubmit} className="w-full">
              {saving ? 'Salvataggio…' : 'Continua'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
