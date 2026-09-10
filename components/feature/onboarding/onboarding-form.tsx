'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
import { OnboardingAgreements } from './onboarding-agreements';
import { OnboardingAvatarPicker } from './onboarding-avatar-picker';
import { OnboardingCardPreview } from './onboarding-card-preview';

interface OnboardingFormProps {
  userName?: string | null;
  initialGamertag: string | null;
  suggestedGamertag?: string | null;
  redirectTo: string;
  qualifyingMatches: number;
}

const GAMERTAG_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function OnboardingForm({
  userName,
  initialGamertag,
  suggestedGamertag,
  redirectTo,
  qualifyingMatches,
}: OnboardingFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialGamertag ?? suggestedGamertag ?? '');
  const [selectedAvatarId, setSelectedAvatarId] = useState(() =>
    getUnlockedAvatarId(getSavedAvatarId(), qualifyingMatches));
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{
    value: string; result: GamertagAvailability;
  } | null>(null);
  const [fairPlayAccepted, setFairPlayAccepted] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const checkRevision = useRef(0);
  const submitting = useRef(false);

  const trimmed = value.trim();
  const validFormat = GAMERTAG_PATTERN.test(trimmed);
  const unchanged = trimmed.length > 0 && trimmed === (initialGamertag ?? '');
  const currentAvailability = availability?.value === trimmed ? availability.result : null;
  const canSubmit = validFormat && !saving && !checking &&
    (unchanged || (currentAvailability?.validFormat && currentAvailability.available === true)) &&
    rulesAccepted && fairPlayAccepted;

  function handleAvatarSelect(id: string) {
    if (saving || !isAvatarUnlocked(id, qualifyingMatches)) return;
    setSelectedAvatarId(id);
  }

  async function handleGamertagChange(next: string) {
    const revision = ++checkRevision.current;
    setValue(next);
    setError(null);
    setAvailability(null);
    setChecking(false);
    const candidate = next.trim();
    if (!GAMERTAG_PATTERN.test(candidate) || candidate === (initialGamertag ?? '')) return;

    setChecking(true);
    try {
      const result = await checkGamertagAvailabilityAction(candidate);
      if (revision !== checkRevision.current) return;
      if (!result.validFormat) {
        setError('Impossibile verificare la disponibilità. Riprova.');
        return;
      }
      setAvailability({ value: candidate, result });
    } catch {
      if (revision === checkRevision.current) setError('Impossibile verificare la disponibilità. Riprova.');
    } finally {
      if (revision === checkRevision.current) setChecking(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError(null);
    try {
      const result = await setGamertagAction(trimmed);
      if (!result.ok) {
        setError(result.error ?? 'Impossibile salvare il gamertag. Riprova.');
        return;
      }
      saveAvatarId(selectedAvatarId);
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Impossibile salvare il gamertag. Riprova.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-labelledby="onboarding-heading" className="w-full max-w-xl mx-auto space-y-5">
      <TournamentRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      <header className="text-center space-y-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
          Ebartex Tournaments
        </p>
        <h1 id="onboarding-heading" className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
          {userName ? `Benvenuto, ${userName}!` : 'Crea il tuo profilo duellante'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Scegli la tua icona, imposta il tuo gamertag e preparati a sfidare la community.
        </p>
      </header>

      <OnboardingCardPreview gamertag={value} avatarId={selectedAvatarId} />

      <div className="space-y-4 rounded-2xl border border-white/15 bg-gradient-to-b from-[#162032]/95 via-[#0d1424]/95 to-[#080d18]/95 p-4 shadow-2xl backdrop-blur-md sm:p-5 text-white">
        <fieldset disabled={saving} className="min-w-0">
          <legend className="sr-only">Scegli la tua icona</legend>
          <OnboardingAvatarPicker
            selectedAvatarId={selectedAvatarId}
            qualifyingMatches={qualifyingMatches}
            onSelect={handleAvatarSelect}
          />
        </fieldset>

        <div className="space-y-2 border-t border-white/10 pt-3.5">
          <label htmlFor="gamertag-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Gamertag nei tornei
          </label>
          <div className="relative">
            <Input
              id="gamertag-input"
              name="tournament-gamertag"
              value={value}
              onChange={(event) => { void handleGamertagChange(event.target.value); }}
              placeholder="Es. DragoBlu92"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              minLength={3}
              maxLength={20}
              required
              pattern="[a-zA-Z0-9_]{3,20}"
              disabled={saving}
              aria-describedby="gamertag-help gamertag-status"
              aria-invalid={trimmed.length > 0 && !validFormat}
              className={`h-11 rounded-xl border-white/15 bg-white/[0.05] text-sm text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary${checking ? ' pr-10' : ''}`}
            />
            {checking && (
              <Loader2 aria-hidden className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <p id="gamertag-help" className="text-slate-400">3–20 caratteri (lettere, numeri, underscore)</p>
            <p id="gamertag-status" role="status" className="font-semibold">
              {checking ? (
                <span className="text-slate-400">Verifica disponibilità…</span>
              ) : trimmed && !validFormat ? (
                <span className="text-destructive">Formato non valido</span>
              ) : currentAvailability ? (
                <span className={currentAvailability.available ? 'text-emerald-400' : 'text-destructive'}>
                  {currentAvailability.available ? '✓ Disponibile' : '✕ Già occupato'}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Condizioni di partecipazione obbligatorie
        </p>
        <OnboardingAgreements
          fairPlayAccepted={fairPlayAccepted}
          onToggleFairPlay={() => setFairPlayAccepted((prev) => !prev)}
          rulesAccepted={rulesAccepted}
          onToggleRules={() => setRulesAccepted((prev) => !prev)}
          onOpenRulesModal={() => setRulesOpen(true)}
          disabled={saving}
        />
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-center text-xs font-semibold text-red-300">
          <p>{error}</p>
          {!currentAvailability && validFormat && !unchanged && (
            <button
              type="button"
              disabled={checking || saving}
              onClick={() => { void handleGamertagChange(value); }}
              className="mt-1 font-semibold underline underline-offset-2 hover:text-white"
            >
              Riprova la verifica
            </button>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={!canSubmit}
        className="h-12 w-full rounded-xl text-sm font-bold uppercase tracking-wider shadow-2xl transition-all disabled:opacity-50"
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Salvataggio in corso…
          </span>
        ) : (
          'Entra nella sala tornei'
        )}
      </Button>
    </form>
  );
}
