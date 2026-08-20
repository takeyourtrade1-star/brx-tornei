'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ExternalLink, Pencil, Sparkles, X } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { fetchMyAchievementsAction } from '@/actions/achievements';
import { evaluateAchievements } from '@/lib/data/achievements';
import { TournamentRulesModal } from '@/components/feature/legal/tournament-rules-modal';
import { getSavedAvatarId, saveAvatarId } from '@/lib/avatars';
import { calculateDailyWins, calculateWinStreak } from '@/lib/rank';
import { getEbartexProfileUrl } from '@/lib/social-preferences';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import { cn } from '@/lib/utils';
import { AchievementCard, AchievementSummary } from './achievement-card';
import { ProfileAvatarPicker } from './profile-avatar-picker';
import { ProfileRankBadge } from './profile-rank-badge';
import { RankLeagueInfo } from './rank-league-info';

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  gamertag: string;
  ebartexUsername?: string | null;
  initialReputation?: ReputationSummary | null;
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; reputation: ReputationSummary }
  | { status: 'error'; message: string };

/** Drawer laterale con modifica gamertag, avatar, badge e leghe. */
export function ProfileDrawer({
  open,
  onClose,
  gamertag,
  ebartexUsername,
  initialReputation,
}: ProfileDrawerProps) {
  const [state, setState] = useState<FetchState>(() =>
    initialReputation ? { status: 'success', reputation: initialReputation } : { status: 'idle' },
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState(() => getSavedAvatarId());
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handleAvatarChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ avatarId: string }>;
      if (customEvent.detail?.avatarId) setSelectedAvatarId(customEvent.detail.avatarId);
    };
    window.addEventListener('ebartex-avatar-changed', handleAvatarChanged);
    return () => window.removeEventListener('ebartex-avatar-changed', handleAvatarChanged);
  }, []);

  const handleSelectAvatar = (id: string) => {
    setSelectedAvatarId(id);
    saveAvatarId(id);
  };

  useEffect(() => {
    if (!open || state.status === 'success' || state.status === 'loading') return;
    let cancelled = false;
    setState({ status: 'loading' });
    fetchMyAchievementsAction().then((res) => {
      if (cancelled) return;
      if (res && 'error' in res) {
        setState({ status: 'error', message: res.error });
      } else if (res && 'reputation' in res && res.reputation) {
        setState({ status: 'success', reputation: res.reputation });
      } else {
        setState({ status: 'error', message: 'Dati non disponibili' });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, state.status]);

  const rep = state.status === 'success' ? state.reputation : null;
  const dailyWins = calculateDailyWins(rep);
  const winStreak = calculateWinStreak(rep);
  const achievements = useMemo(() => (rep ? evaluateAchievements(rep) : []), [rep]);

  if (!open || !mounted) return null;

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[900]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Profilo giocatore"
        className="profile-drawer-panel absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Testata */}
        <header className="relative flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <ProfileRankBadge
              avatarId={selectedAvatarId}
              gamertag={gamertag}
              wins={dailyWins}
              winStreak={winStreak}
              onFire={winStreak >= 3}
              interactive={false}
              hidePill
            />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Profilo torneo</p>
              <h2 className="mt-0.5 truncate text-lg font-black tracking-tight text-header-bg sm:text-xl">{gamertag}</h2>
              {state.status === 'success' && (
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {state.reputation.played} partite · {state.reputation.wins} vinte · {state.reputation.losses} perse
                </p>
              )}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-header-bg"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        {/* Contenuto */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {/* Modifica Gamertag (Presto in arrivo) */}
          <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Pencil className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 truncate">Modifica gamertag</span>
            </div>
            <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700">
              Presto in arrivo
            </span>
          </div>

          {/* Sezione Avatar Collassabile */}
          <ProfileAvatarPicker
            selectedAvatarId={selectedAvatarId}
            onSelectAvatar={handleSelectAvatar}
            open={avatarOpen}
            onToggle={() => setAvatarOpen((prev) => !prev)}
          />

          {/* Sezione Badge Collassabile */}
          <section className="mb-4 rounded-2xl border border-slate-300 bg-slate-50/90 p-3.5 shadow-sm transition-all">
            <button
              type="button"
              onClick={() => setBadgesOpen((prev) => !prev)}
              aria-expanded={badgesOpen}
              className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white border border-slate-300 shadow-sm">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Badge & Obiettivi</h3>
                  <p className="text-[10px] font-bold text-slate-400">
                    {achievements.filter((a) => a.unlockedNow).length} di {achievements.length} sbloccati
                  </p>
                </div>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform duration-200', badgesOpen && 'rotate-180')} />
            </button>

            {badgesOpen && (
              <div className="mt-3.5 space-y-4 border-t border-slate-300 pt-3 animate-in fade-in-50 duration-200">
                <AchievementSummary achievements={achievements} />
                <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {achievements.map((a) => (
                    <AchievementCard key={a.id} achievement={a} />
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Box Info: Spiegazione Leghe, Reset 24h & Fuoco */}
          <RankLeagueInfo />

          {/* Link al profilo marketplace Ebartex */}
          <a
            href={getEbartexProfileUrl(ebartexUsername, gamertag)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-900 bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-slate-800"
          >
            <span>Mostra il mio profilo Ebartex</span>
            <ExternalLink className="h-4 w-4 text-slate-400" />
          </a>

          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 hover:text-header-bg"
          >
            Regolamento e informativa privacy dei tornei
          </button>
          <TournamentRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

          <form action={logoutAction} className="mt-4 pb-1 text-center">
            <button type="submit" className="text-xs font-bold text-red-600 transition hover:text-red-700 hover:underline">
              Esci
            </button>
          </form>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
