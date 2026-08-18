'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TournamentRulesModal } from '@/components/feature/legal/tournament-rules-modal';
import { checkGamertagAvailabilityAction, setGamertagAction } from '@/actions/players';
import { GAME_AVATARS, getSavedAvatarId, saveAvatarId } from '@/lib/avatars';
import type { GamertagAvailability } from '@/lib/data/player-api-client';
import { OnboardingCardPreview } from './onboarding-card-preview';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingFormProps {
  initialGamertag: string | null;
  suggestedGamertag?: string | null;
  redirectTo: string;
}

/**
 * Form di onboarding per la scelta del gamertag e dell'avatar iniziale.
 */
export function OnboardingForm({
  initialGamertag,
  suggestedGamertag,
  redirectTo,
}: OnboardingFormProps) {
  const router = useRouter();
  const defaultInitial = initialGamertag ?? suggestedGamertag ?? '';
  const [value, setValue] = useState(defaultInitial);
  const [selectedAvatarId, setSelectedAvatarId] = useState(() => getSavedAvatarId());
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<GamertagAvailability | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [checking, startChecking] = useTransition();
  const [saving, startSaving] = useTransition();

  function handleAvatarSelect(id: string) {
    setSelectedAvatarId(id);
    saveAvatarId(id);
  }

  function handleGamertagChange(next: string) {
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
      saveAvatarId(selectedAvatarId);
      router.push(redirectTo);
      router.refresh();
    });
  }

  const trimmed = value.trim();
  const unchanged = trimmed.length > 0 && trimmed === (initialGamertag ?? '');
  const showAvailability = !unchanged && trimmed.length >= 3 && availability !== null;
  const mustAcceptRules = initialGamertag === null;
  const canSubmit =
    trimmed.length >= 3 &&
    trimmed.length <= 20 &&
    !saving &&
    (unchanged || availability?.available === true) &&
    (!mustAcceptRules || rulesAccepted);

  return (
    <div className="space-y-4">
      <TournamentRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      {/* Anteprima Card Duellante ingrandita e autentica */}
      <OnboardingCardPreview gamertag={value} avatarId={selectedAvatarId} />

      {/* Form di Selezione e Registrazione */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-900/[0.08] bg-white p-5 shadow-xl sm:p-6"
      >
        {/* Scelta Avatar Starter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Scegli il tuo avatar
            </label>
            <span className="text-[11px] text-slate-500">Puoi cambiarlo in ogni momento</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {GAME_AVATARS.map((avatar) => {
              const Icon = avatar.icon;
              const isSelected = avatar.id === selectedAvatarId;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => handleAvatarSelect(avatar.id)}
                  title={`${avatar.name} (${avatar.subtitle})`}
                  aria-label={`Seleziona avatar ${avatar.name}`}
                  className={cn(
                    'group relative grid aspect-square place-items-center rounded-xl border p-2 transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/40 scale-105'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100 hover:scale-105'
                  )}
                >
                  <Icon className="h-7 w-7 transition-transform group-hover:scale-110 sm:h-8 sm:w-8" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Inserimento Gamertag */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <label htmlFor="gamertag-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Gamertag nei tornei
          </label>
          <div className="relative">
            <Input
              id="gamertag-input"
              autoFocus
              value={value}
              onChange={(e) => handleGamertagChange(e.target.value)}
              placeholder="Es. DragoBlu92"
              maxLength={20}
              aria-label="Gamertag"
              className="h-11 pr-10 text-sm font-semibold"
            />
            {checking && (
              <span className="absolute right-3 top-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              3-20 caratteri (lettere, numeri, underscore)
            </span>
            {showAvailability && (
              <span
                className={
                  availability?.validFormat && availability.available
                    ? 'font-bold text-emerald-600'
                    : 'font-bold text-destructive'
                }
              >
                {!availability?.validFormat
                  ? 'Formato non valido'
                  : availability.available
                    ? 'Disponibile'
                    : 'Già occupato'}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Accettazione Regolamento */}
        {mustAcceptRules && (
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-900/[0.06] bg-slate-50 px-3.5 py-3">
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
              Accetto il{' '}
              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                className="font-bold text-primary underline underline-offset-2 hover:text-primary-text"
              >
                regolamento e l&apos;informativa privacy dei tornei
              </button>
              , inclusa la connessione video P2P e le registrazioni locali anti-cheat.
            </label>
          </div>
        )}

        {/* Pulsante di Submit */}
        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-12 w-full text-sm font-bold uppercase tracking-wider shadow-lg transition-all"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvataggio in corso…
            </span>
          ) : (
            'Entra nella sala tornei'
          )}
        </Button>
      </form>
    </div>
  );
}

