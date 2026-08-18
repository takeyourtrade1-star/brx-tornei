'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, ExternalLink, Swords, UserPlus, X } from 'lucide-react';
import { getPublicProfileAction, sendFriendRequestAction } from '@/actions/social';
import { getEbartexProfileUrl } from '@/lib/social-preferences';
import { ProfileRankBadge } from './profile-rank-badge';
import { PublicProfileStats } from './public-profile-stats';
import type { PublicPlayerProfile } from '@/types/social';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PublicProfileModalProps {
  gamertag: string | null;
  open: boolean;
  onClose: () => void;
  onChallenge?: (gamertag: string) => void;
}

export function PublicProfileModal({ gamertag, open, onClose, onChallenge }: PublicProfileModalProps) {
  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !gamertag) {
      setProfile(null);
      setRequestSent(false);
      setErrorMsg(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getPublicProfileAction(gamertag).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok && res.data) setProfile(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, gamertag]);

  if (!open || !mounted || !gamertag) return null;

  const handleAddFriend = async () => {
    if (!profile) return;
    setErrorMsg(null);
    const res = await sendFriendRequestAction(profile.gamertag);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Impossibile inviare la richiesta.');
      return;
    }
    setRequestSent(true);
  };

  const presenceConfig = {
    online: { label: 'Online adesso', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    in_game: { label: 'In Partita', color: 'bg-purple-50 text-purple-700 border-purple-300' },
    dnd: { label: 'Non disturbare', color: 'bg-amber-50 text-amber-800 border-amber-300' },
    recent: { label: 'Attivo di recente', color: 'bg-amber-50 text-amber-700 border-amber-300' },
    offline: { label: 'Non attivo di recente', color: 'bg-slate-100 text-slate-600 border-slate-300' },
  };

  const presence = profile ? presenceConfig[profile.presence] : presenceConfig.offline;
  const isDnd = profile?.presence === 'dnd';
  const showEbartexCard =
    profile &&
    (profile.friendship === 'self' ||
      (profile.showEbartexProfile !== false && Boolean(profile.ebartexUsername)));

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[950]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Profilo di ${gamertag}`}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="relative flex items-center justify-between border-b border-slate-200/80 bg-white px-7 py-5">
          <div className="flex items-center gap-3.5 min-w-0">
            {profile && (
              <ProfileRankBadge
                avatarId={profile.avatarId}
                gamertag={profile.gamertag}
                wins={profile.stats.dailyWins}
                winStreak={profile.stats.winStreak}
                onFire={profile.stats.winStreak >= 3}
                interactive={false}
                hidePill
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider', presence.color)}>
                  {presence.label}
                </span>
                {profile?.isBot && (
                  <span className="rounded-md border border-purple-300 bg-purple-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-700">
                    BOT | Test
                  </span>
                )}
              </div>
              <h2 className="mt-0.5 truncate text-xl font-black tracking-tight text-header-bg sm:text-2xl">
                {gamertag}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 px-7 py-6">
          {loading ? (
            <div className="py-16 text-center text-xs font-bold text-slate-400 animate-pulse">
              Caricamento profilo duellante…
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 animate-in fade-in duration-150">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Barra Azioni Social & Ebartex */}
              <div className="flex flex-wrap items-center gap-2.5">
                {profile.friendship !== 'self' && (
                  <>
                    {profile.friendship === 'friend' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm">
                        <Check className="h-4 w-4" /> Siete amici
                      </span>
                    ) : requestSent || profile.friendship === 'pending_sent' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 shadow-sm">
                        Richiesta inviata
                      </span>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleAddFriend}
                        className="h-10 gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 shadow-sm"
                      >
                        <UserPlus className="h-4 w-4" /> Aggiungi amico
                      </Button>
                    )}

                    {onChallenge && (
                      <Button
                        type="button"
                        disabled={isDnd}
                        title={
                          isDnd
                            ? 'Questo giocatore ha impostato "Non disturbare" per il momento e non può ricevere inviti di sfida'
                            : undefined
                        }
                        onClick={() => {
                          onClose();
                          onChallenge(profile.gamertag);
                        }}
                        className="h-10 gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-5 text-xs font-black text-white shadow-sm hover:brightness-105 disabled:opacity-40"
                      >
                        <Swords className="h-4 w-4" /> Sfida a duello
                      </Button>
                    )}
                  </>
                )}

                {showEbartexCard && (
                  <a
                    href={getEbartexProfileUrl(profile.ebartexUsername)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition"
                  >
                    <span>Carte su Ebartex</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </a>
                )}
              </div>

              {/* Statistiche e Badge d'Onore */}
              <PublicProfileStats stats={profile.stats} honorBadges={profile.honorBadges} />
            </div>
          ) : (
            <div className="py-16 text-center text-xs font-bold text-slate-400">
              Profilo non disponibile.
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
