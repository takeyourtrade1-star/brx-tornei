'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TournamentRulesModal } from '@/components/feature/legal/tournament-rules-modal';
import { checkGamertagAvailabilityAction, setGamertagAction } from '@/actions/players';
import {
  getSavedAvatarId,
  getUnlockedAvatarId,
  isAvatarUnlocked,
  saveAvatarId,
} from '@/lib/avatars';
import type { GamertagAvailability } from '@/lib/data/player-api-client';
import { OnboardingGuide } from './onboarding-guide';
import { OnboardingCardPreview } from './onboarding-card-preview';
import { OnboardingAgreements } from './onboarding-agreements';
import { OnboardingAvatarPicker } from './onboarding-avatar-picker';
import { Loader2 } from 'lucide-react';

interface OnboardingFormProps {
  userName?: string | null;
  initialGamertag: string | null;
  suggestedGamertag?: string | null;
  redirectTo: string;
  qualifyingMatches: number;
}

/**
 * Gestore interattivo dell'onboarding: guida, configurazione avatar/gamertag,
 * patti di fair play in liquid glass e CTA finale.
 */
export function OnboardingForm({
  userName,
  initialGamertag,
  suggestedGamertag,
  redirectTo,
  qualifyingMatches,
}: OnboardingFormProps) {
  const router = useRouter();
  const defaultInitial = initialGamertag ?? suggestedGamertag ?? '';
  const [value, setValue] = useState(defaultInitial);
  const [selectedAvatarId, setSelectedAvatarId] = useState(() =>
    getUnlockedAvatarId(getSavedAvatarId(), qualifyingMatches));
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<GamertagAvailability | null>(null);
  const [fairPlayAccepted, setFairPlayAccepted] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [checking, startChecking] = useTransition();
  const [saving, startSaving] = useTransition();

  function handleAvatarSelect(id: string) {
    if (!isAvatarUnlocked(id, qualifyingMatches)) return;
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
    (!mustAcceptRules || (rulesAccepted && fairPlayAccepted));

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-5">
      <TournamentRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      {/* Griglia Superiore: Guida a sinistra, Preview + Form a destra */}
      <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Colonna Sinistra: Guida */}
        <section className="lg:col-span-7">
          <OnboardingGuide userName={userName} />
        </section>

        {/* Colonna Destra: Anteprima Carta + Scelta Avatar e Gamertag */}
        <section className="space-y-3 lg:col-span-5">
          <OnboardingCardPreview gamertag={value} avatarId={selectedAvatarId} />

          <div className="space-y-3 rounded-2xl border border-slate-900/[0.08] bg-white p-4 shadow-xl sm:p-4.5 text-slate-900">
            <OnboardingAvatarPicker
              selectedAvatarId={selectedAvatarId}
              qualifyingMatches={qualifyingMatches}
              onSelect={handleAvatarSelect}
            />

            {/* Inserimento Gamertag */}
            <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
              <label
                htmlFor="gamertag-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-700"
              >
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
                  className="h-9.5 pr-9 text-xs sm:text-sm font-semibold text-slate-900"
                />
                {checking && (
                  <span className="absolute right-2.5 top-2.5 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">
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
          </div>
        </section>
      </div>

      {/* Sezione Inferiore Full-Width: Condizioni Liquid Glass e Bottone CTA */}
      <div className="space-y-3.5 border-t border-white/10 pt-4">
        {mustAcceptRules && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Condizioni di partecipazione & Fair Play
            </p>
            <OnboardingAgreements
              fairPlayAccepted={fairPlayAccepted}
              onToggleFairPlay={() => setFairPlayAccepted((prev) => !prev)}
              rulesAccepted={rulesAccepted}
              onToggleRules={() => setRulesAccepted((prev) => !prev)}
              onOpenRulesModal={() => setRulesOpen(true)}
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-2.5 text-center text-xs font-semibold text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-center pt-1">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-11 sm:h-12 w-full max-w-lg text-sm font-bold uppercase tracking-wider shadow-2xl transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Accesso in corso…
              </span>
            ) : (
              'Entra nella sala tornei'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
