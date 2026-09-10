'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TournamentRulesModal } from '@/components/feature/legal/tournament-rules-modal';
import { checkGamertagAvailabilityAction, setGamertagAction } from '@/actions/players';
import { getSavedAvatarId, getUnlockedAvatarId, isAvatarUnlocked, saveAvatarId } from '@/lib/avatars';
import type { GamertagAvailability } from '@/lib/data/player-api-client';
import { OnboardingAgreements } from './onboarding-agreements';
import { OnboardingAvatarPicker } from './onboarding-avatar-picker';

interface OnboardingFormProps {
  initialGamertag: string | null;
  redirectTo: string;
  qualifyingMatches: number;
}

const GAMERTAG_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

/** Scelta del profilo con verifica della disponibilità legata al valore corrente. */
export function OnboardingForm({
  initialGamertag, redirectTo, qualifyingMatches,
}: OnboardingFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialGamertag ?? '');
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
  const mustAcceptRules = initialGamertag === null;
  const canSubmit = validFormat && !saving && !checking &&
    (unchanged || (currentAvailability?.validFormat && currentAvailability.available === true)) &&
    (!mustAcceptRules || (rulesAccepted && fairPlayAccepted));

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
      if (revision === checkRevision.current) {
        setError('Impossibile verificare la disponibilità. Riprova.');
      }
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
    <form onSubmit={handleSubmit} aria-labelledby="onboarding-title"
      className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl sm:p-8">
      <TournamentRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <header className="space-y-1.5">
        <h1 id="onboarding-title" className="text-2xl font-bold tracking-tight">Il tuo profilo da battaglia</h1>
        <p className="text-sm text-slate-500">Scegli come farti riconoscere nei tornei.</p>
      </header>

      <div className="space-y-2">
        <label htmlFor="gamertag-input" className="block text-sm font-semibold">Gamertag</label>
        <div className="relative">
          <Input id="gamertag-input" name="tournament-gamertag" value={value}
            onChange={(event) => { void handleGamertagChange(event.target.value); }}
            placeholder="Inserisci il tuo gamertag da battaglia"
            autoComplete="off" autoCapitalize="none" spellCheck={false}
            minLength={3} maxLength={20} required pattern="[a-zA-Z0-9_]{3,20}"
            disabled={saving} aria-describedby="gamertag-help gamertag-status"
            aria-invalid={trimmed.length > 0 && !validFormat}
            className={`h-12 rounded-xl border-slate-300 bg-white text-sm text-slate-900 placeholder:text-xs sm:placeholder:text-sm${checking ? ' pr-10' : ''}`} />
          {checking && <Loader2 aria-hidden className="absolute right-3 top-4 h-4 w-4 animate-spin text-slate-400" />}
        </div>
        <p id="gamertag-help" className="text-xs text-slate-500">3–20 caratteri: lettere, numeri e underscore.</p>
        <p id="gamertag-status" role="status" className="text-xs font-medium">
          {checking ? 'Verifica disponibilità…' : trimmed && !validFormat
            ? <span className="text-destructive">Usa 3–20 lettere, numeri o underscore.</span>
            : currentAvailability
              ? <span className={currentAvailability.available ? 'text-emerald-700' : 'text-destructive'}>
                {currentAvailability.available ? 'Gamertag disponibile' : 'Gamertag già in uso: provane un altro.'}
              </span>
              : null}
        </p>
      </div>

      <fieldset disabled={saving} className="min-w-0 border-t border-slate-100 pt-5">
        <legend className="sr-only">Scegli la tua icona</legend>
        <OnboardingAvatarPicker selectedAvatarId={selectedAvatarId}
          qualifyingMatches={qualifyingMatches} onSelect={handleAvatarSelect} />
      </fieldset>

      <div className="space-y-5 border-t border-slate-100 pt-5">
        {mustAcceptRules && (
          <OnboardingAgreements fairPlayAccepted={fairPlayAccepted}
            onToggleFairPlay={() => setFairPlayAccepted((prev) => !prev)}
            rulesAccepted={rulesAccepted} onToggleRules={() => setRulesAccepted((prev) => !prev)}
            onOpenRulesModal={() => setRulesOpen(true)} disabled={saving} />
        )}
        {error && (
          <div role="alert" className="space-y-1 text-xs text-destructive">
            <p>{error}</p>
            {!currentAvailability && validFormat && !unchanged && (
              <button type="button" disabled={checking || saving}
                onClick={() => { void handleGamertagChange(value); }}
                className="font-semibold underline underline-offset-2">Riprova la verifica</button>
            )}
          </div>
        )}
        <Button type="submit" disabled={!canSubmit} className="h-12 w-full rounded-xl text-sm font-semibold">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />Salvataggio…</> : 'Entra nella sala tornei'}
        </Button>
      </div>
    </form>
  );
}
