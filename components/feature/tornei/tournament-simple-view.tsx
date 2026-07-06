'use client';

import { useState } from 'react';
import { ChevronDown, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TournamentLiveOrchestrator } from './tournament-live-orchestrator';
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
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <>
      <DashboardHeader
        user={user}
        showMinigameBack={showMinigameBack}
        onBackToMinigame={onBackToMinigame}
      />
      <main className="mx-auto mt-4 flex w-full max-w-content animate-auth-enter flex-col px-4 pb-16 sm:px-6">
        {/* Nota mobile: i tornei si giocano da PC, il telefono fa da webcam.
            Comprimibile per non rubare spazio: si espande al tocco. */}
        {isMobile && (
          <div className="simple-card mb-4 overflow-hidden rounded-3xl border-primary/25">
            <button
              type="button"
              onClick={() => setNoteOpen((v) => !v)}
              aria-expanded={noteOpen}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl border border-primary/40 bg-primary/15 text-primary">
                <Smartphone className="h-4 w-4" />
              </div>
              <p className="flex-1 text-[13px] font-semibold text-white/85">
                I tornei si giocano <span className="text-primary">dal PC</span>
              </p>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-white/50 transition-transform duration-300',
                  noteOpen && 'rotate-180',
                )}
                aria-hidden
              />
            </button>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
                noteOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <p className="px-3 pb-3 text-sm leading-relaxed text-white/75">
                  Puoi usare la webcam del <span className="font-bold text-primary">PC</span> oppure
                  quella del <span className="font-bold text-primary">telefono</span> (una sola per
                  partita): apri i tornei sul computer e scegli la sorgente quando crei o partecipi.
                </p>
              </div>
            </div>
          </div>
        )}

        <TournamentLiveOrchestrator
          tournaments={tournaments}
          selection={selection}
          formatId={formatId}
          formatName={formatName}
          modeName={modeName}
          mobile={isMobile}
        />
      </main>
    </>
  );
}
