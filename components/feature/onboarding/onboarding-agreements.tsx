'use client';

import { Check, ShieldCheck, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingAgreementsProps {
  fairPlayAccepted: boolean;
  onToggleFairPlay: () => void;
  rulesAccepted: boolean;
  onToggleRules: () => void;
  onOpenRulesModal: () => void;
}

/**
 * Selettore delle condizioni in stile iOS Liquid Glass con spunte perfettamente centrate.
 */
export function OnboardingAgreements({
  fairPlayAccepted,
  onToggleFairPlay,
  rulesAccepted,
  onToggleRules,
  onOpenRulesModal,
}: OnboardingAgreementsProps) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {/* 1. Fair Play e Rispetto Community */}
      <div
        role="checkbox"
        tabIndex={0}
        aria-checked={fairPlayAccepted}
        onClick={onToggleFairPlay}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onToggleFairPlay();
          }
        }}
        className={cn(
          'group relative flex cursor-pointer select-none items-start gap-3 rounded-xl border p-3 sm:p-3.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          fairPlayAccepted
            ? 'border-primary/50 bg-gradient-to-b from-primary/[0.08] to-white/[0.04] shadow-[0_0_16px_rgba(255,115,0,0.12)] ring-1 ring-primary/30'
            : 'border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-white/20 hover:bg-white/[0.06]'
        )}
      >
        {/* Toggle / Spunta centrata stile iOS */}
        <div
          className={cn(
            'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-all duration-200 mt-0.5',
            fairPlayAccepted
              ? 'border-primary bg-primary text-white scale-105 shadow-[0_0_8px_rgba(255,115,0,0.5)]'
              : 'border-white/30 bg-white/5 text-transparent group-hover:border-white/50'
          )}
        >
          <Check className="h-3 w-3 stroke-[3.5]" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <HeartHandshake className="h-3.5 w-3.5 text-primary" aria-hidden />
            <h4 className="text-xs font-bold text-white leading-tight">Fair play e rispetto</h4>
          </div>
          <p className="text-[11px] leading-snug text-slate-300">
            Accetto di giocare con lealtà, rispettare ogni avversario, non usare gamertag offensivi
            e favorire una community sana.
          </p>
        </div>
      </div>

      {/* 2. Regolamento e Privacy */}
      <div
        role="checkbox"
        tabIndex={0}
        aria-checked={rulesAccepted}
        onClick={onToggleRules}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onToggleRules();
          }
        }}
        className={cn(
          'group relative flex cursor-pointer select-none items-start gap-3 rounded-xl border p-3 sm:p-3.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          rulesAccepted
            ? 'border-primary/50 bg-gradient-to-b from-primary/[0.08] to-white/[0.04] shadow-[0_0_16px_rgba(255,115,0,0.12)] ring-1 ring-primary/30'
            : 'border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-white/20 hover:bg-white/[0.06]'
        )}
      >
        {/* Toggle / Spunta centrata stile iOS */}
        <div
          className={cn(
            'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-all duration-200 mt-0.5',
            rulesAccepted
              ? 'border-primary bg-primary text-white scale-105 shadow-[0_0_8px_rgba(255,115,0,0.5)]'
              : 'border-white/30 bg-white/5 text-transparent group-hover:border-white/50'
          )}
        >
          <Check className="h-3 w-3 stroke-[3.5]" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
            <h4 className="text-xs font-bold text-white leading-tight">Regolamento e privacy</h4>
          </div>
          <p className="text-[11px] leading-snug text-slate-300">
            Accetto il{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenRulesModal();
              }}
              className="font-bold text-primary underline underline-offset-2 hover:text-white"
            >
              regolamento dei tornei
            </button>
            , la connessione video P2P e le registrazioni locali anti-cheat.
          </p>
        </div>
      </div>
    </div>
  );
}

