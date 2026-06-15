'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Home, LogOut, Smartphone } from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { logoutAction } from '@/actions/auth';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TournamentsTable } from './tournaments-table';
import { CreateTournamentButton } from './create-tournament-button';
import { WebcamLinkModal } from './webcam-link-modal';
import dynamic from 'next/dynamic';
import type { Tournament } from '@/types/tournament';
import type { Selection } from '@/lib/validations/selection';
import { createTournamentFromGameAction, joinTournamentAction } from '@/actions/tournaments';

// Import target game component dynamically to bypass canvas SSR requirements
const IsoRoomGame = dynamic(() => import('@/minigioco-test/IsoRoomGame'), {
  ssr: false,
});

interface TournamentGameViewProps {
  tournaments: Tournament[];
  selection: Selection;
  user: any;
  formatId: string;
  formatName: string;
  modeName: string;
}

/** Azione in attesa del passo "webcam via QR" prima di essere eseguita. */
type PendingAction =
  | { kind: 'create'; tournament: Tournament }
  | { kind: 'join'; id: string };

export function TournamentGameView({
  tournaments,
  selection,
  user,
  formatId,
  formatName,
  modeName,
}: TournamentGameViewProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const router = useRouter();
  const [creating, startTransition] = useTransition();
  const logoUrl = getCdnImageUrl('logo.png');

  useEffect(() => {
    const checkMobile = () => {
      // breakpoint for mobile view matches Tailwind's md (768px)
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // "Crea Torneo": prima il QR per collegare la webcam del telefono, poi la
  // creazione vera (alla conferma del modale).
  const handleCreateTournament = (t: Tournament) => {
    setPending({ kind: 'create', tournament: t });
  };

  // "Partecipa": stesso passo QR prima dell'iscrizione. I tornei privati
  // ("Chiedi di partecipare") inviano solo la richiesta: il QR andrà mostrato
  // dopo l'approvazione (hook da collegare quando esisterà quel flusso).
  const handleJoinTournament = (id: string) => {
    const t = tournaments.find((x) => x.id === id);
    if (t?.isPrivate) {
      startTransition(async () => {
        await joinTournamentAction(id);
        router.refresh();
      });
      return;
    }
    setPending({ kind: 'join', id });
  };

  const confirmPending = () => {
    if (!pending) return;
    startTransition(async () => {
      if (pending.kind === 'create') {
        await createTournamentFromGameAction(pending.tournament);
      } else {
        await joinTournamentAction(pending.id);
      }
      router.refresh();
      setPending(null);
    });
  };

  // Safe skeleton loader during SSR / hydration resolution
  if (isMobile === null) {
    return (
      <>
        {/* Mobile skeleton placeholder */}
        <div className="block md:hidden min-h-screen bg-[#0f172a]" aria-busy="true" aria-label="Caricamento tornei">
          <div className="header-gradient h-20 w-full" />
          <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 sm:px-6">
            <div className="flex items-end justify-between">
              <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10" />
              <div className="h-11 w-44 animate-pulse rounded-full bg-white/10" />
            </div>
            <div className="brx-glass h-72 animate-pulse rounded-3xl border border-white/15" />
          </div>
        </div>

        {/* Desktop gaming loading screen placeholder */}
        <div className="hidden md:flex fixed inset-0 w-screen h-screen z-[100] flex-col items-center justify-center select-none"
             style={{
               background: 'radial-gradient(1100px 650px at 50% 28%, #142347 0%, #0d111c 65%, #2e1b10 100%)'
             }}
        >
          <div className="flex flex-col items-center gap-6 max-w-xs w-full text-center">
            <div className="relative mb-2">
              <div className="absolute inset-0 bg-[#FF7300]/20 blur-xl rounded-full scale-110 animate-pulse" />
              <Image
                src={logoUrl}
                alt="Ebartex Logo"
                width={140}
                height={48}
                className="h-12 w-auto object-contain relative z-10"
                priority
                unoptimized
              />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <span className="font-sans text-xs font-black tracking-[0.25em] text-[#FF7300] uppercase">
                Caricamento mini-gioco
              </span>
              <span className="font-mono text-xs text-white/40 tracking-wider">
                Avvio in corso...
              </span>
            </div>
            <div className="w-64 h-3 rounded-full bg-white/5 border border-white/10 p-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#FF7300] to-[#ffd76e]" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  const username = user.name ?? user.email;

  if (isMobile) {
    return (
      <>
        <DashboardHeader
          user={user}
          formatId={formatId}
          formatName={formatName}
          modeName={modeName}
        />
        <main className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 pb-16 sm:px-6 mt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-wide text-white drop-shadow">
                Tornei <span className="text-primary">{formatName}</span>
              </h1>
              <p className="mt-1 text-sm text-white/60">
                {modeName} · Buy-In <span className="font-bold text-marquee">For Fun</span>
              </p>
            </div>
            <CreateTournamentButton selection={selection} />
          </div>

          {/* Nota mobile: i tornei si giocano da PC, il telefono fa da webcam */}
          <div className="brx-glass flex items-start gap-3 rounded-2xl border border-[#FF7300]/25 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#FF7300]/40 bg-[#FF7300]/15 text-[#FF7300]">
              <Smartphone className="h-4 w-4" />
            </div>
            <p className="text-sm leading-relaxed text-white/75">
              I tornei si giocano <span className="font-bold text-white">dal PC</span>. Il tuo
              telefono può però fare da <span className="font-bold text-[#FF7300]">webcam</span>:
              apri i tornei sul computer e, quando crei la partita, inquadra il QR per usare
              questa fotocamera.
            </p>
          </div>

          <TournamentsTable tournaments={tournaments} />
        </main>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen bg-[#191b2e] z-40 overflow-hidden select-none animate-auth-enter">
        <div className="w-full h-full relative">
          <IsoRoomGame
            roomName={`Sala Tornei · ${formatName}`}
            username={username}
            formatName={formatName}
            modeName={modeName}
            tournaments={tournaments}
            onCreateTournament={handleCreateTournament}
            onJoinTournament={handleJoinTournament}
          />
        </div>

        {/* Floating Overlays */}
        {/* Logo & Home button overlay (top-left, left of the shifted title chip) */}
        <div className="absolute top-[12px] left-[16px] z-50 flex items-center gap-4">
          <Link href="/" className="transition-opacity hover:opacity-90 flex items-center justify-center">
            <Image
              src={logoUrl}
              alt="Ebartex"
              width={90}
              height={32}
              className="h-8 w-auto object-contain block"
              priority
              unoptimized
            />
          </Link>
          <Link
            href="/hub"
            aria-label="Torna alla selezione"
            className="text-white/60 hover:text-white transition-colors duration-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
          >
            <Home className="h-5 w-5" />
          </Link>
        </div>

        {/* Email & Logout overlay (top-right, left of the mute button) */}
        <div className="absolute top-[12px] right-[60px] z-50 flex items-center gap-4 text-sm font-semibold text-white/50 select-none h-8">
          <span className="flex items-center">{user.email}</span>
          <form action={logoutAction} className="flex items-center">
            <button
              type="submit"
              aria-label="Esci"
              className="text-white/60 hover:text-red-400 transition-colors duration-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      <WebcamLinkModal
        open={!!pending}
        busy={creating}
        confirmLabel={pending?.kind === 'join' ? 'Partecipa' : 'Crea Torneo'}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
