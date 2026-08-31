'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormatFilter } from '@/lib/validations/selection';
import { FORMATS, type FormatId, type ModeId } from '@/lib/data/catalog';
import type { Tournament } from '@/types/tournament';

const IsoRoomGame = dynamic(() => import('@/minigioco-test/IsoRoomGame'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-slate-950 text-sm font-semibold text-white/70">
      Caricamento Sala Arcade…
    </div>
  ),
});

interface ArcadeRoomLauncherProps {
  open: boolean;
  onClose: () => void;
  tournaments: Tournament[];
  gamertag: string;
  formatId: FormatFilter;
  formatName: string;
  modeId: ModeId;
  modeName: string;
}

function explicitFormat(formatId: FormatFilter): FormatId {
  return formatId === 'all' ? 'modern' : formatId;
}

function formatFromBoardDraft(draft: unknown, fallback: FormatId): FormatId {
  if (!draft || typeof draft !== 'object') return fallback;
  const game = (draft as { gioco?: unknown }).gioco;
  if (typeof game !== 'string') return fallback;
  const normalized = game.trim().toLowerCase();
  return FORMATS.find(
    (format) => format.id === normalized || format.name.toLowerCase() === normalized,
  )?.id ?? fallback;
}

export function ArcadeRoomLauncher({
  open,
  onClose,
  tournaments,
  gamertag,
  formatId,
  formatName,
  modeId,
  modeName,
}: ArcadeRoomLauncherProps) {
  const router = useRouter();
  const selectedFormat = explicitFormat(formatId);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const goToLobby = useCallback(
    (format: string, mode: string, focusQuery: string) => {
      onClose();
      router.push(
        `/tornei?format=${encodeURIComponent(format)}&mode=${encodeURIComponent(mode)}${focusQuery}`,
      );
    },
    [onClose, router],
  );

  const handleCreateTournament = useCallback(
    (draft: unknown) => {
      // La vecchia bacheca resta solo la superficie visiva: la creazione vera
      // passa dalla lobby attuale, che richiede il mazzo dichiarato.
      goToLobby(
        formatFromBoardDraft(draft, selectedFormat),
        modeId,
        '&focusCreate=1',
      );
    },
    [goToLobby, modeId, selectedFormat],
  );

  const handleJoinTournament = useCallback(
    (tournamentId: string) => {
      const target = tournaments.find((tournament) => tournament.id === tournamentId);
      goToLobby(
        target?.format ?? selectedFormat,
        target?.mode ?? modeId,
        `&focusTable=${encodeURIComponent(tournamentId)}`,
      );
    },
    [goToLobby, modeId, selectedFormat, tournaments],
  );

  const handleObserveTournament = useCallback(
    (tournamentId: string) => {
      onClose();
      router.push(`/tornei/${encodeURIComponent(tournamentId)}/live?role=observer`);
    },
    [onClose, router],
  );

  const handleOpenDecks = useCallback(() => {
    onClose();
    router.push('/mazzi');
  }, [onClose, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/95 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sala Arcade secondaria"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Chiudi Sala Arcade"
        title="Chiudi Sala Arcade"
        className="absolute right-3 top-3 z-[90] grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/45 text-white/75 shadow-lg backdrop-blur-sm transition hover:border-primary/50 hover:bg-primary/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-6 sm:top-6"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="h-full w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:rounded-3xl">
        <IsoRoomGame
          roomName={`Sala Tornei · ${formatName}`}
          username={gamertag}
          formatId={formatId}
          modeId={modeId}
          formatName={formatName}
          modeName={modeName}
          tournaments={tournaments}
          integrationMode="site"
          onCreateTournament={handleCreateTournament}
          onJoinTournament={handleJoinTournament}
          onObserveTournament={handleObserveTournament}
          onOpenDecks={handleOpenDecks}
          onExitToSimple={onClose}
        />
      </div>
    </div>
  );
}
