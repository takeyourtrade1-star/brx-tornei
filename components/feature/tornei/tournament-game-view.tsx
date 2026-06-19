'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Gamepad2, Home, LogOut, Smartphone, X } from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { logoutAction } from '@/actions/auth';
import {
  HEADER_BRX_LOGO_INTRINSIC_HEIGHT,
  HEADER_BRX_LOGO_INTRINSIC_WIDTH,
  HEADER_BRX_LOGO_OVERLAY_IMAGE_CLASS,
  HEADER_BRX_LOGO_PATH,
} from '@/components/layout/header-brx-column';
import { TournamentGameLoadingScreen } from './tournament-game-loading-screen';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TournamentsTable } from './tournaments-table';
import { CreateTournamentButton } from './create-tournament-button';
import { WebcamLinkModal } from './webcam-link-modal';
import { MatchViewModal, type MatchRole } from './match/match-view-modal';
import { MatchPip } from './match/match-pip';
import { webcamLink } from '@/lib/webrtc/webcam-stream-store';
import dynamic from 'next/dynamic';
import type { Tournament } from '@/types/tournament';
import type { InventoryItem } from '@/types/inventory';
import type { Selection } from '@/lib/validations/selection';
import { createTournamentFromGameAction, joinTournamentAction } from '@/actions/tournaments';

// Import target game component dynamically to bypass canvas SSR requirements
const IsoRoomGame = dynamic(() => import('@/minigioco-test/IsoRoomGame'), {
  ssr: false,
});

interface TournamentGameViewProps {
  tournaments: Tournament[];
  inventory: InventoryItem[];
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

/** Partita aperta nella vista match (da giocatore o da osservatore). */
interface MatchSession {
  tournament: Tournament;
  role: MatchRole;
}

export function TournamentGameView({
  tournaments,
  inventory,
  selection,
  user,
  formatId,
  formatName,
  modeName,
}: TournamentGameViewProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  /** Vista match aperta a tutto schermo (giocatore o osservatore). */
  const [match, setMatch] = useState<MatchSession | null>(null);
  /** Partita osservata in Picture-in-Picture (fuori dal minigioco). */
  const [pip, setPip] = useState<Tournament | null>(null);
  /** Popup "richiesta inviata" per i tornei privati. */
  const [requestSent, setRequestSent] = useState<string | null>(null);
  /** "Vista semplice": mostra la pagina classica (come da mobile) senza mini-gioco. */
  const [simpleView, setSimpleView] = useState(false);
  const router = useRouter();
  const [creating, startTransition] = useTransition();
  const logoUrl = getCdnImageUrl(HEADER_BRX_LOGO_PATH);
  const username = user.name ?? user.email;

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
  // ("Chiedi di partecipare") inviano solo la richiesta e mostrano un popup di
  // conferma: il QR comparirà dopo l'approvazione (flusso da collegare).
  const handleJoinTournament = (id: string) => {
    const t = tournaments.find((x) => x.id === id);
    if (t?.isPrivate) {
      setRequestSent(t.format ? t.format.replace('-', ' ') : 'Torneo privato');
      startTransition(async () => {
        await joinTournamentAction(id);
        router.refresh();
      });
      return;
    }
    setPending({ kind: 'join', id });
  };

  // "Osserva" (icona occhio nel minigioco): apre la vista match come spettatore
  // della partita live di altri giocatori.
  const handleObserveTournament = (id: string) => {
    const t = tournaments.find((x) => x.id === id);
    if (t) setMatch({ tournament: t, role: 'observer' });
  };

  // Skip del QR: simula la scansione e apre direttamente la vista match come
  // giocatore (per ora senza webcam reale → anteprime simulate).
  const handleSkipToMatch = () => {
    if (!pending) return;
    let t: Tournament | undefined;
    if (pending.kind === 'join') t = tournaments.find((x) => x.id === pending.id);
    else t = pending.tournament;
    setPending(null);
    if (t) setMatch({ tournament: t, role: 'player' });
  };

  // Attiva il Picture-in-Picture: chiude il modale ma tiene la mini-partita.
  const handleActivatePip = () => {
    if (match) {
      setPip(match.tournament);
      setMatch(null);
    }
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

        <TournamentGameLoadingScreen />
      </>
    );
  }

  if (isMobile || simpleView) {
    return (
      <>
        <DashboardHeader
          user={user}
          formatId={formatId}
          formatName={formatName}
          modeName={modeName}
        />
        <main className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 pb-16 sm:px-6 mt-6 animate-auth-enter">
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

          {/* Ritorno al mini-gioco (solo quando si è scelta la vista semplice da desktop) */}
          {simpleView && !isMobile && (
            <button
              type="button"
              onClick={() => setSimpleView(false)}
              className="brx-glass inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-[#FF7300]/50 hover:text-white"
            >
              <Gamepad2 className="h-4 w-4 text-[#FF7300]" />
              Torna al mini-gioco
            </button>
          )}

          {/* Nota mobile: i tornei si giocano da PC, il telefono fa da webcam */}
          {isMobile && (
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
          )}

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
            inventory={inventory}
            onCreateTournament={handleCreateTournament}
            onJoinTournament={handleJoinTournament}
            onObserveTournament={handleObserveTournament}
            onExitToSimple={() => setSimpleView(true)}
          />
        </div>

        {/* Floating Overlays */}
        {/* Logo & Home button overlay (top-left, left of the shifted title chip) */}
        <div className="absolute top-[12px] left-[16px] z-50 flex items-center gap-4">
          <Link href="/" className="transition-opacity hover:opacity-90 flex items-center justify-center">
            <Image
              src={logoUrl}
              alt="Ebartex"
              width={HEADER_BRX_LOGO_INTRINSIC_WIDTH}
              height={HEADER_BRX_LOGO_INTRINSIC_HEIGHT}
              className={HEADER_BRX_LOGO_OVERLAY_IMAGE_CLASS}
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
        onSkip={handleSkipToMatch}
      />

      {/* Vista partita live: da giocatore (skip QR) o da osservatore (occhio). */}
      <MatchViewModal
        open={!!match}
        tournament={match?.tournament ?? null}
        role={match?.role ?? 'observer'}
        me={username}
        playerStream={webcamLink.get()}
        onClose={() => setMatch(null)}
        onPip={handleActivatePip}
      />

      {/* Picture-in-Picture dello spettatore, fuori dal minigioco. */}
      {pip && (
        <MatchPip
          tournament={pip}
          me={username}
          onExpand={() => {
            setMatch({ tournament: pip, role: 'observer' });
            setPip(null);
          }}
          onClose={() => setPip(null)}
        />
      )}

      {/* Popup conferma richiesta per i tornei privati. */}
      {requestSent && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setRequestSent(null)}
            aria-hidden
          />
          <div className="brx-glass relative w-full max-w-sm rounded-3xl border border-white/15 p-6 text-center">
            <button
              type="button"
              onClick={() => setRequestSent(null)}
              aria-label="Chiudi"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/15 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-black uppercase tracking-wide text-white">
              Richiesta di partecipare inviata
            </h3>
            <p className="mt-1.5 text-sm text-white/60">
              La tua richiesta per il torneo{' '}
              <span className="font-bold capitalize text-marquee">{requestSent}</span> è stata
              inviata all&apos;organizzatore. Riceverai il QR per la webcam dopo l&apos;approvazione.
            </p>
            <button
              type="button"
              onClick={() => setRequestSent(null)}
              className="brx-liquid-glass-btn mt-5 w-full rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
}
