'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormatFilter } from '@/lib/validations/selection';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import type { Tournament } from '@/types/tournament';
import type { Deck } from '@/types/deck';
import type { LobbyTable } from '@/lib/lobby';
import type { SocialRoomFriendPresence } from '@/types/social';
import type { ArcadeOfficialSurface } from './arcade-official-modal';

const ArcadeOfficialModal = dynamic(
  () =>
    import('./arcade-official-modal').then(
      (module) => module.ArcadeOfficialModal,
    ),
  { ssr: false },
);

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
  tables: LobbyTable[];
  initialDecks: Deck[];
  initialFriends: SocialRoomFriendPresence[];
  gamertag: string;
  formatId: FormatFilter;
  formatName: string;
  modeId: ModeId;
  modeName: string;
  busy: boolean;
  error: string | null;
  createLocked: boolean;
  onOpenCreateTournament: (formatId: FormatId) => void;
  onSit: (table: LobbyTable) => void;
  onOpen: (table: LobbyTable) => void;
  onLeave: (table: LobbyTable) => void;
  onGoLive: (table: LobbyTable) => void;
}

function explicitFormat(formatId: FormatFilter): FormatId {
  return formatId === 'all' ? 'modern' : formatId;
}

export function ArcadeRoomLauncher({
  open,
  onClose,
  tournaments,
  tables,
  initialDecks,
  initialFriends,
  gamertag,
  formatId,
  formatName,
  modeId,
  modeName,
  busy,
  error,
  createLocked,
  onOpenCreateTournament,
  onSit,
  onOpen,
  onLeave,
  onGoLive,
}: ArcadeRoomLauncherProps) {
  const router = useRouter();
  const selectedFormat = explicitFormat(formatId);
  const [officialSurface, setOfficialSurface] = useState<ArcadeOfficialSurface | null>(null);

  useEffect(() => {
    if (!open) {
      setOfficialSurface(null);
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleCloseOfficialSurface = useCallback(() => {
    if (officialSurface === 'decks') router.refresh();
    setOfficialSurface(null);
  }, [officialSurface, router]);

  const handleCreateTournament = useCallback(() => {
    onOpenCreateTournament(selectedFormat);
  }, [onOpenCreateTournament, selectedFormat]);
  const handleOpenTournaments = useCallback(
    () => setOfficialSurface('tournaments'),
    [],
  );
  const handleOpenDecks = useCallback(() => setOfficialSurface('decks'), []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950 p-2 sm:p-4"
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
          initialFriends={initialFriends}
          tournaments={tournaments}
          integrationMode="site"
          onOpenTournaments={handleOpenTournaments}
          onOpenCreateTournament={handleCreateTournament}
          onOpenDecks={handleOpenDecks}
          onExitToSimple={onClose}
        />
      </div>
      {officialSurface ? (
        <ArcadeOfficialModal
          surface={officialSurface}
          onClose={handleCloseOfficialSurface}
          tables={tables}
          initialDecks={initialDecks}
          formatName={formatName}
          modeName={modeName}
          busy={busy}
          error={error}
          createLocked={createLocked}
          onSit={onSit}
          onOpen={onOpen}
          onLeave={onLeave}
          onGoLive={onGoLive}
        />
      ) : null}
    </div>
  );
}
