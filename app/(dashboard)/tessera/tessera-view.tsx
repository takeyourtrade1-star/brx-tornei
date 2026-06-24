'use client';

import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { MembershipCardView } from '@/components/feature/membership/membership-card';
import { useMembership } from '@/hooks/use-membership';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import { type MembershipCard } from '@/lib/membership/membership';

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-2.5 last:border-0">
      <span className="text-[13px] text-white/55">{label}</span>
      <span className="truncate text-[14px] font-medium text-white">{value}</span>
    </div>
  );
}

function CardDetails({ card }: { card: MembershipCard }) {
  const birth = card.birthDate
    ? new Date(card.birthDate).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-header-bg/70 p-5">
      <DetailRow label="Codice tessera" value={card.code} />
      <DetailRow label="Email" value={card.email} />
      <DetailRow label="Telefono" value={card.phone} />
      <DetailRow label="Data di nascita" value={birth} />
      <DetailRow label="Città" value={card.city} />
      <DetailRow label="Circolo" value={card.club} />
    </div>
  );
}

export function TesseraView() {
  const { state, loading } = useMembership();

  return (
    <main className="mx-auto w-full max-w-md px-5 py-8 sm:py-12">
      <Link
        href={DEFAULT_TOURNAMENTS_PATH}
        className="inline-flex items-center gap-2 text-[14px] font-medium text-white/70 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna ai tornei
      </Link>

      <h1 className="mt-5 font-display text-3xl font-bold text-white">La mia tessera</h1>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        </div>
      ) : state?.status === 'member' ? (
        <>
          <p className="mt-1.5 text-[15px] text-white/65">
            Mostra questa tessera agli organizzatori per partecipare ai tornei.
          </p>
          <div className="mt-7">
            <MembershipCardView card={state.card} interactive />
          </div>
          <CardDetails card={state.card} />
        </>
      ) : (
        <div className="mt-7 rounded-2xl border border-white/10 bg-header-bg/70 p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
            <CreditCard className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-white">Non sei ancora associato</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-white/65">
            Richiedi la tessera digitale del circolo per partecipare ai tornei con premi.
          </p>
          <Link
            href="/associazione"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-bold uppercase tracking-wide text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Diventa associato
          </Link>
        </div>
      )}
    </main>
  );
}
