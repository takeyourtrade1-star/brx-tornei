'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/layout/AuthShell';
import { MembershipOnboardingForm } from '@/components/feature/membership/membership-onboarding-form';
import { MembershipCardReveal } from '@/components/feature/membership/membership-card-reveal';
import { useMembership } from '@/hooks/use-membership';
import { getCdnImageUrl } from '@/lib/config';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import type { MembershipCard, MembershipInput } from '@/lib/membership/membership';
import { cn } from '@/lib/utils';

interface AssociazioneViewProps {
  email: string;
  name: string | null;
}

const FORM_COLUMN_CLASS = cn(
  'col-start-1 row-start-1 flex w-full flex-1 flex-col bg-white/90',
  'px-6 py-6 sm:px-8 sm:py-8',
  'lg:col-start-2 lg:min-h-screen lg:justify-center lg:overflow-y-auto lg:bg-transparent',
  'lg:px-8 lg:py-10 xl:px-10 xl:py-12'
);

export function AssociazioneView({ email, name }: AssociazioneViewProps) {
  const router = useRouter();
  const { state, becomeMember, skip } = useMembership();
  const [issued, setIssued] = useState<MembershipCard | null>(null);
  const checkedRef = useRef(false);

  // Decisione una sola volta, al primo caricamento dello stato: se è GIÀ socio
  // (da una sessione precedente) va al profilo. Dopo l'emissione qui non si rientra,
  // così il reveal della tessera appena creata non viene mai scavalcato.
  useEffect(() => {
    if (checkedRef.current || state === null) return;
    checkedRef.current = true;
    if (state.status === 'member') router.replace('/tessera');
  }, [state, router]);

  const handleComplete = (input: MembershipInput) => {
    setIssued(becomeMember(input));
  };

  const handleSkip = () => {
    skip();
    router.replace(DEFAULT_TOURNAMENTS_PATH);
  };

  const handleContinue = () => {
    router.replace(DEFAULT_TOURNAMENTS_PATH);
  };

  if (issued) {
    return <MembershipCardReveal card={issued} onContinue={handleContinue} />;
  }

  return (
    <AuthShell splitHero compact>
      {/* Colonna sinistra: logo Ebartex grosso sopra il video (desktop). */}
      <aside
        className="relative hidden flex-col items-center justify-center px-10 lg:col-start-1 lg:row-start-1 lg:flex"
        aria-hidden
      >
        <Image
          src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
          alt="Ebartex"
          width={700}
          height={263}
          className="h-auto w-[clamp(200px,22vw,340px)] object-contain drop-shadow-2xl"
          sizes="340px"
          priority
          unoptimized
        />
        <p className="mt-6 max-w-xs text-center text-[15px] leading-relaxed text-white/70">
          La tua tessera digitale per partecipare ai tornei del circolo e vincere premi.
        </p>
      </aside>

      <section className={FORM_COLUMN_CLASS}>
        {/* Logo compatto solo mobile (continuità con le altre schermate auth). */}
        <div className="mb-2 flex justify-center lg:hidden">
          <Image
            src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
            alt="Ebartex"
            width={700}
            height={263}
            className="h-12 w-auto object-contain"
            sizes="180px"
            priority
            unoptimized
          />
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
          <MembershipOnboardingForm
            defaultEmail={email}
            defaultName={name}
            onComplete={handleComplete}
            onSkip={handleSkip}
          />
        </div>
      </section>
    </AuthShell>
  );
}
