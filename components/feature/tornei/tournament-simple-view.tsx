'use client';

import { Smartphone } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TournamentsDashboard } from './tournaments-dashboard';
import type { FormatId } from '@/lib/data/catalog';
import type { Selection } from '@/lib/validations/selection';
import type { Tournament } from '@/types/tournament';

interface TournamentSimpleViewProps {
  user: any;
  isMobile: boolean;
  showMinigameBack: boolean;
  onBackToMinigame: () => void;
  tournaments: Tournament[];
  selection: Selection;
  formatId: FormatId;
  formatName: string;
  modeName: string;
}

export function TournamentSimpleView({
  user,
  isMobile,
  showMinigameBack,
  onBackToMinigame,
  tournaments,
  selection,
  formatId,
  formatName,
  modeName,
}: TournamentSimpleViewProps) {
  return (
    <>
      <DashboardHeader
        user={user}
        showMinigameBack={showMinigameBack}
        onBackToMinigame={onBackToMinigame}
      />
      <main className="mx-auto mt-4 flex w-full max-w-content animate-auth-enter flex-col px-4 pb-16 sm:px-6">
        {/* Nota mobile: i tornei si giocano da PC, il telefono fa da webcam */}
        {isMobile && (
          <div className="simple-card mb-6 flex items-start gap-3 rounded-3xl border-primary/25 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-primary/40 bg-primary/15 text-primary">
              <Smartphone className="h-4 w-4" />
            </div>
            <p className="text-sm leading-relaxed text-white/75">
              I tornei si giocano <span className="font-bold text-white">dal PC</span>. Il tuo
              telefono può però fare da <span className="font-bold text-primary">webcam</span>:
              apri i tornei sul computer e, quando crei la partita, inquadra il QR per usare
              questa fotocamera.
            </p>
          </div>
        )}

        <TournamentsDashboard
          tournaments={tournaments}
          selection={selection}
          formatId={formatId}
          formatName={formatName}
          modeName={modeName}
        />
      </main>
    </>
  );
}
