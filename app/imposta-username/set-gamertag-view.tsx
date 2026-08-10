'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TournamentRulesModal } from '@/components/feature/legal/tournament-rules-modal';
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
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
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
  // Chi cambia un gamertag esistente l'ha già accettato alla prima attivazione.
  const mustAcceptRules = initialGamertag === null;
  const canSubmit =
    trimmed.length >= 3 &&
    trimmed.length <= 20 &&
    !saving &&
    (unchanged || availability?.available === true) &&
    (!mustAcceptRules || rulesAccepted);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <TournamentRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
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
            {mustAcceptRules && (
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-900/[0.06] bg-slate-50 px-3 py-3">
                <Checkbox
                  id="accept-rules"
                  checked={rulesAccepted}
                  onCheckedChange={setRulesAccepted}
                  aria-describedby="accept-rules-label"
                  className="mt-0.5"
                />
                <label
                  id="accept-rules-label"
                  htmlFor="accept-rules"
                  className="cursor-pointer text-xs leading-relaxed text-slate-600"
                >
                  Registrandomi con questo gamertag entro nella community dei tornei e dichiaro di
                  aver letto e di accettare il{' '}
                  <button
                    type="button"
                    onClick={() => setRulesOpen(true)}
                    className="font-semibold text-primary underline underline-offset-2"
                  >
                    regolamento e l&apos;informativa privacy dei tornei
                  </button>
                  , incluse le note su connessione P2P e registrazione anti-cheat.
                </label>
              </div>
            )}
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
