'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { logoutAction } from '@/actions/auth';
import { fetchMyAchievementsAction } from '@/actions/achievements';
import { evaluateAchievements } from '@/lib/data/achievements';
import { TournamentRulesModal } from '@/components/feature/legal/tournament-rules-modal';
import { GAME_AVATARS, getSavedAvatarId, saveAvatarId } from '@/lib/avatars';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import { cn } from '@/lib/utils';
import { AchievementCard, AchievementSummary } from './achievement-card';
import { ProfileRankBadge } from './profile-rank-badge';

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  gamertag: string;
  /** Reputazione già nota: evita una fetch se ce l'hai in pagina. */
  initialReputation?: ReputationSummary | null;
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; reputation: ReputationSummary }
  | { status: 'error'; message: string };

/**
 * Drawer laterale con profilo + selettore avatar 10 icone + badge achievement.
 * Lazy: se `initialReputation` è null o assente fetcha via server action alla
 * prima apertura.
 */
export function ProfileDrawer({ open, onClose, gamertag, initialReputation }: ProfileDrawerProps) {
  const [state, setState] = useState<FetchState>(() =>
    initialReputation ? { status: 'success', reputation: initialReputation } : { status: 'idle' },
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState(() => getSavedAvatarId());
  const [mounted, setMounted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleSelectAvatar = (id: string) => {
    setSelectedAvatarId(id);
    saveAvatarId(id);
  };

  // Portal su document.body: l'header del padre ha backdrop-blur (crea un
  // containing block) che farebbe "agganciare" il drawer all'header invece
  // che al viewport. Con il portal il fixed lavora sempre sul viewport.
  useEffect(() => setMounted(true), []);

  // Focus trap minimale + chiusura su Esc.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => closeRef.current?.focus(), 20);

    const onKeyDown = (event: KeyboardEvent) => {
      if (rulesOpen) return;
      if (event.key === 'Escape') return void onClose();
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
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

  const achievements = useMemo(
    () => (state.status === 'success' ? evaluateAchievements(state.reputation) : []),
    [state],
  );

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[900]"
      onClick={onClose}
      aria-hidden="false"
    >
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
              wins={state.status === 'success' ? state.reputation.wins : 0}
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
                  {state.reputation.played} partite · {state.reputation.wins} vinte ·{' '}
                  {state.reputation.losses} perse
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
          {/* Sezione Selezione Avatar */}
          <section className="mb-6 rounded-2xl border border-slate-900/[0.08] bg-slate-50/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Avatar di gioco
              </h3>
              <span className="text-[10px] font-bold text-slate-400">10 disponibili</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {GAME_AVATARS.map((avatar) => {
                const Icon = avatar.icon;
                const isSelected = avatar.id === selectedAvatarId;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleSelectAvatar(avatar.id)}
                    title={avatar.name}
                    aria-label={`Seleziona avatar ${avatar.name}`}
                    className={cn(
                      'group relative grid aspect-square place-items-center rounded-xl border p-2 transition-all',
                      isSelected
                        ? 'border-primary bg-white shadow-md ring-2 ring-primary/40 scale-105'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white',
                    )}
                  >
                    <Icon className={cn('h-5 w-5 transition-transform group-hover:scale-110', avatar.color)} />
                  </button>
                );
              })}
            </div>
          </section>

          {state.status === 'loading' && (
            <p className="rounded-xl border border-slate-900/[0.06] bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
              Caricamento dei tuoi badge…
            </p>
          )}

          {state.status === 'error' && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {state.message}
            </p>
          )}

          {state.status === 'success' && (
            <>
              <AchievementSummary achievements={achievements} />
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {achievements.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </ul>
              <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
                I badge si sbloccano giocando: ogni partita conclusa aggiorna lo stato. Nessuno è
                segreto — accumula vittorie e buon comportamento.
              </p>
            </>
          )}

          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="mt-6 w-full rounded-xl border border-slate-900/[0.06] bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-600 transition hover:border-slate-900/15 hover:text-header-bg"
          >
            Regolamento e informativa privacy dei tornei
          </button>
          <TournamentRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

          <form action={logoutAction} className="mt-5 pb-2 text-center">
            <button
              type="submit"
              className="text-xs font-bold text-red-600 transition hover:text-red-700 hover:underline"
            >
              Esci
            </button>
          </form>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
