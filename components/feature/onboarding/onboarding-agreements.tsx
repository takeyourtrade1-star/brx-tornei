interface OnboardingAgreementsProps {
  fairPlayAccepted: boolean;
  onToggleFairPlay: () => void;
  rulesAccepted: boolean;
  onToggleRules: () => void;
  onOpenRulesModal: () => void;
  disabled?: boolean;
}

/** Accettazioni esplicite e compatte, interne alla card del profilo. */
export function OnboardingAgreements({
  fairPlayAccepted, onToggleFairPlay, rulesAccepted, onToggleRules, onOpenRulesModal, disabled,
}: OnboardingAgreementsProps) {
  const checkboxClass = 'mt-0.5 h-4 w-4 shrink-0 accent-primary focus-visible:outline-primary';
  return (
    <div className="space-y-2.5 text-xs leading-5 text-slate-600">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input type="checkbox" checked={fairPlayAccepted} onChange={onToggleFairPlay}
          disabled={disabled} className={checkboxClass} />
        <span>Accetto di giocare con lealtà, rispettare ogni avversario e non usare gamertag offensivi.</span>
      </label>
      <div className="flex items-start gap-2.5">
        <input id="onboarding-rules" type="checkbox" checked={rulesAccepted} onChange={onToggleRules}
          disabled={disabled} className={checkboxClass} aria-labelledby="onboarding-rules-label" />
        <div id="onboarding-rules-label">
          <label htmlFor="onboarding-rules" className="cursor-pointer">Accetto il </label>
          <button type="button" onClick={onOpenRulesModal}
            className="font-semibold text-primary-text underline underline-offset-2">
            regolamento dei tornei
          </button>
          <label htmlFor="onboarding-rules" className="cursor-pointer">
            , la connessione video P2P e le registrazioni locali anti-cheat.
          </label>
        </div>
      </div>
    </div>
  );
}
