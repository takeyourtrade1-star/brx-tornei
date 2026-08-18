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
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingFormProps {
  initialGamertag: string | null;
  suggestedGamertag?: string | null;
  redirectTo: string;
}

/**
 * Form interattivo per la scelta del gamertag, avatar iniziale e accettazione regolamento.
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
    <div className="space-y-5">
      <TournamentRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      {/* Live Preview della Carta Duellante */}
      <OnboardingCardPreview gamertag={value} avatarId={selectedAvatarId} />

      {/* Form di Configurazione */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-900/[0.08] bg-white p-5 shadow-xl sm:p-6"
      >
        {/* Sezione Avatar Starter */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            1. Scegli il tuo Avatar
          </label>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
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
                    'group relative grid aspect-square place-items-center rounded-xl border p-1.5 transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/40 scale-105'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100 hover:scale-105'
                  )}
                >
                  <Icon className="h-6 w-6 transition-transform group-hover:scale-110 sm:h-7 sm:w-7" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Sezione Gamertag */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label htmlFor="gamertag-input" className="block text-xs font-black uppercase tracking-wider text-slate-700">
            2. Inserisci il tuo Gamertag
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
              className="h-11 text-sm font-semibold pr-10"
            />
            {checking && (
              <span className="absolute right-3 top-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>
            )}
            {!checking && showAvailability && availability?.available && (
              <span className="absolute right-3 top-3 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            )}
            {!checking && showAvailability && !availability?.available && (
              <span className="absolute right-3 top-3 text-destructive">
                <XCircle className="h-5 w-5" />
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">
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
                    : 'Già in uso'}
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
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-900/[0.06] bg-slate-50/80 px-3.5 py-3">
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
              , inclusa la connessione P2P e l&apos;anti-cheat locale a tutela del gioco.
            </label>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-12 w-full text-sm font-bold uppercase tracking-wider shadow-lg transition-all"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Accesso in corso…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Entra nell&apos;Arena dei Tornei
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
