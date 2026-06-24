'use client';

import { ArrowRight } from 'lucide-react';
import { MembershipCardView } from '@/components/feature/membership/membership-card';
import type { MembershipCard } from '@/lib/membership/membership';

interface MembershipCardRevealProps {
  card: MembershipCard;
  onContinue: () => void;
}

/** Schermata celebrativa post-onboarding: la tessera appena emessa. */
export function MembershipCardReveal({ card, onContinue }: MembershipCardRevealProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/* Glow ambientale dietro la tessera */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        aria-hidden
        style={{
          background:
            'radial-gradient(circle, rgba(187,130,255,0.35) 0%, rgba(255,45,146,0.18) 40%, rgba(0,0,0,0) 70%)',
        }}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <h1 className="font-display text-3xl font-bold leading-tight text-white drop-shadow sm:text-4xl">
          Benvenuto, {card.firstName}!
        </h1>
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-white/70">
          La tua tessera è pronta ed è salvata nel profilo. Mostrala per partecipare ai tornei e
          ritirare i premi.
        </p>

        <div className="mt-7 w-full animate-tessera-pop">
          <MembershipCardView card={card} interactive />
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-8 flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-[15px] font-bold uppercase tracking-wide text-primary-foreground shadow-[0_8px_24px_-6px_rgba(255,115,0,0.6)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Entra nei tornei
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="mt-3 text-[12px] text-white/45">
          La trovi sempre nel tuo profilo, in alto a destra.
        </p>
      </div>
    </div>
  );
}
