'use client';

import { useState } from 'react';
import { PanelBottomOpen, X } from 'lucide-react';
import type { MatchDetail } from '@/types/match';
import { cn } from '@/lib/utils';
import { MatchTableHeader } from './match-table-header';
import { MediaControls } from './media-controls';
import { ScoreSidebar } from './score-sidebar';
import { VideoStage } from './video-stage';

interface MatchTableViewProps {
  match: MatchDetail;
}

/** Orchestratore client: video stage + pannello punteggio (desktop) / drawer (mobile). */
export function MatchTableView({ match }: MatchTableViewProps) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'connecting' | 'good' | 'excellent'>(
    'connecting'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  function handleOpponentConnected(connected: boolean) {
    setOpponentConnected(connected);
    if (connected) {
      window.setTimeout(() => setConnectionQuality('good'), 800);
      window.setTimeout(() => setConnectionQuality('excellent'), 2000);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-8 sm:px-6">
      <MatchTableHeader match={match} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <VideoStage
            opponentName={match.opponent}
            micEnabled={micEnabled}
            onOpponentConnectedChange={handleOpponentConnected}
          />
          <MediaControls
            micEnabled={micEnabled}
            onToggleMic={() => setMicEnabled((v) => !v)}
            connectionQuality={connectionQuality}
            opponentConnected={opponentConnected}
          />
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <ScoreSidebar
            match={match}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            className="max-h-[calc(100vh-12rem)] overflow-y-auto"
          />
        </div>
      </div>

      {/* Mobile drawer trigger */}
      <button
        type="button"
        onClick={() => setMobileDrawerOpen(true)}
        className="brx-liquid-glass-btn fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white lg:hidden"
      >
        <PanelBottomOpen className="h-4 w-4" />
        Punteggio
      </button>

      {/* Mobile drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Chiudi pannello"
          />
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl',
              'border border-white/15 bg-gradient-card p-4 pb-8 shadow-2xl'
            )}
          >
            <div className="mb-3 flex justify-center">
              <span className="h-1 w-10 rounded-full bg-white/20" aria-hidden />
            </div>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 hover:bg-white/10"
              aria-label="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
            <ScoreSidebar
              match={match}
              collapsed={false}
              onToggleCollapse={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
