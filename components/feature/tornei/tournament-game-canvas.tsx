'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, LogOut } from 'lucide-react';
import dynamic from 'next/dynamic';
import { logoutAction } from '@/actions/auth';
import { getCdnImageUrl } from '@/lib/config';
import {
  HEADER_BRX_LOGO_INTRINSIC_HEIGHT,
  HEADER_BRX_LOGO_INTRINSIC_WIDTH,
  HEADER_BRX_LOGO_OVERLAY_IMAGE_CLASS,
  HEADER_BRX_LOGO_PATH,
} from '@/components/layout/header-brx-column';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import type { InventoryItem } from '@/types/inventory';
import type { Tournament } from '@/types/tournament';

const IsoRoomGame = dynamic(() => import('@/minigioco-test/IsoRoomGame'), {
  ssr: false,
});

interface TournamentGameCanvasProps {
  user: any;
  formatId: FormatId;
  formatName: string;
  modeId: ModeId;
  modeName: string;
  tournaments: Tournament[];
  inventory: InventoryItem[];
  onCreateTournament: (tournament: Tournament) => void;
  onJoinTournament: (id: string) => void;
  onObserveTournament: (id: string) => void;
  onExitToSimple: () => void;
}

export function TournamentGameCanvas({
  user,
  formatId,
  formatName,
  modeId,
  modeName,
  tournaments,
  inventory,
  onCreateTournament,
  onJoinTournament,
  onObserveTournament,
  onExitToSimple,
}: TournamentGameCanvasProps) {
  const logoUrl = getCdnImageUrl(HEADER_BRX_LOGO_PATH);

  return (
    <div className="fixed inset-0 z-40 h-screen w-screen select-none overflow-hidden bg-[#191b2e] animate-auth-enter">
      <div className="relative h-full w-full">
        <IsoRoomGame
          roomName={`Sala Tornei · ${formatName}`}
          username={user.name ?? user.email}
          formatId={formatId}
          modeId={modeId}
          formatName={formatName}
          modeName={modeName}
          tournaments={tournaments}
          inventory={inventory}
          onCreateTournament={onCreateTournament}
          onJoinTournament={onJoinTournament}
          onObserveTournament={onObserveTournament}
          onExitToSimple={onExitToSimple}
        />
      </div>

      {/* Logo & Home button overlay (top-left) */}
      <div className="absolute left-4 top-3 z-50 flex items-center gap-4">
        <Link href="/" className="flex items-center justify-center transition-opacity hover:opacity-90">
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
          href={DEFAULT_TOURNAMENTS_PATH}
          aria-label="Tornei"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white"
        >
          <Home className="h-5 w-5" />
        </Link>
      </div>

      {/* Email & Logout overlay (top-right) */}
      <div className="absolute right-[60px] top-3 z-50 flex h-8 items-center gap-4 text-sm font-semibold text-white/50 select-none">
        <span className="flex items-center">{user.email}</span>
        <form action={logoutAction} className="flex items-center">
          <button
            type="submit"
            aria-label="Esci"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
