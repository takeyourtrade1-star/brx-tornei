'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Sparkles, X } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { fetchMyAchievementsAction } from '@/actions/achievements';
import { evaluateAchievements } from '@/lib/data/achievements';
import { TournamentRulesModal } from '@/components/feature/legal/tournament-rules-modal';
import { GAME_AVATARS, getAvatarById, getSavedAvatarId, saveAvatarId } from '@/lib/avatars';
import { calculateDailyWins, calculateWinStreak } from '@/lib/rank';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import { cn } from '@/lib/utils';
import { AchievementCard, AchievementSummary } from './achievement-card';
import { ProfileRankBadge } from './profile-rank-badge';
import { RankLeagueInfo } from './rank-league-info';

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  gamertag: string;
  initialReputation?: ReputationSummary | null;
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; reputation: ReputationSummary }
  | { status: 'error'; message: string };

/** Drawer laterale con sezioni avatar/badge comprimibili, box leghe e rank badge. */
export function ProfileDrawer({ open, onClose, gamertag, initialReputation }: ProfileDrawerProps) {
  const [state, setState] = useState<FetchState>(() =>
    initialReputation ? { status: 'success', reputation: initialReputation } : { status: 'idle' },
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState(() => getSavedAvatarId());
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const activeAvatar = getAvatarById(selectedAvatarId);
  const SelectedIcon = activeAvatar.icon;
  const handleSelectAvatar = (id: string) => { setSelectedAvatarId(id); saveAvatarId(id); };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => closeRef.current?.focus(), 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (rulesOpen) return;
      if (event.key === 'Escape') return void onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      window.clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose, rulesOpen]);

  useEffect(() => {
    if (!open || state.status !== 'idle') return;
    setState({ status: 'loading' });
    let cancelled = false;
    fetchMyAchievementsAction()
      .then((res) => {
        if (!cancelled) setState(res.ok ? { status: 'success', reputation: res.reputation } : { status: 'error', message: res.error });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : 'Errore di rete' });
      });
    return () => { cancelled = true; };
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
        <header className="relative flex items-center justify-between gap-3 border-b border-slate-900/[0.06] px-6 py-5">
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Profilo torneo
              </p>
              <h2 className="mt-0.5 truncate text-lg font-black tracking-tight text-header-bg sm:text-xl">
                {gamertag}
              </h2>
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
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-900/[0.1] bg-white text-slate-500 transition hover:border-slate-900/25 hover:text-header-bg"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        {/* Contenuto */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {/* Sezione Avatar Collassabile */}
          <section className="mb-4 rounded-2xl border border-slate-900/[0.08] bg-slate-50/80 p-3.5 transition-all">
            <button
              type="button"
              onClick={() => setAvatarOpen((prev) => !prev)}
              aria-expanded={avatarOpen}
              className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 p-1 shadow-sm ring-1 ring-slate-900/[0.08]">
                  <SelectedIcon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Avatar di gioco
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400">
                    Selezionato: <span className="text-slate-700 font-extrabold">{activeAvatar.name}</span>
                  </p>
                </div>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', avatarOpen && 'rotate-180')} />
            </button>

            {avatarOpen && (
              <div className="mt-3.5 grid grid-cols-5 gap-2 border-t border-slate-900/[0.06] pt-3 animate-in fade-in-50 duration-200">
                {GAME_AVATARS.map((avatar) => {
                  const Icon = avatar.icon;
                  const isSelected = avatar.id === selectedAvatarId;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => handleSelectAvatar(avatar.id)}
                      title={`${avatar.name} (${avatar.subtitle})`}
                      aria-label={`Seleziona avatar ${avatar.name}`}
                      className={cn(
                        'group relative grid aspect-square place-items-center rounded-xl border p-2 transition-all bg-gradient-to-b from-slate-900 via-slate-950 to-black',
                        isSelected
                          ? 'border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.55)] ring-2 ring-amber-400/50 scale-105'
                          : 'border-slate-800 hover:border-slate-600 hover:scale-105',
                      )}
                    >
                      <Icon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Sezione Badge Collassabile */}
          <section className="mb-4 rounded-2xl border border-slate-900/[0.08] bg-slate-50/80 p-3.5 transition-all">
            <button
              type="button"
              onClick={() => setBadgesOpen((prev) => !prev)}
              aria-expanded={badgesOpen}
              className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm ring-1 ring-slate-900/[0.08]">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Badge & Obiettivi
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400">
                    {achievements.filter((a) => a.unlockedNow).length} di {achievements.length} sbloccati
                  </p>
                </div>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', badgesOpen && 'rotate-180')} />
            </button>

            {badgesOpen && (
              <div className="mt-3.5 space-y-4 border-t border-slate-900/[0.06] pt-3 animate-in fade-in-50 duration-200">
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

          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="mt-5 w-full rounded-xl border border-slate-900/[0.06] bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-600 transition hover:border-slate-900/15 hover:text-header-bg"
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
