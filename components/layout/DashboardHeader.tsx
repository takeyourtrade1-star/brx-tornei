'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Flame, Gamepad2 } from 'lucide-react';
import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';
import { GameNavRail } from '@/components/layout/game-nav-rail';
import { ProfileDrawer } from '@/components/feature/profile/profile-drawer';
import { ProfileRankBadge } from '@/components/feature/profile/profile-rank-badge';
import { PublicProfileModal } from '@/components/feature/profile/public-profile-modal';
import { FriendsDrawer } from '@/components/feature/social/friends-drawer';
import { DirectChallengeModal } from '@/components/feature/social/direct-challenge-modal';
import { IncomingChallengeToast } from '@/components/feature/social/incoming-challenge-toast';
import { fetchMyAchievementsAction } from '@/actions/achievements';
import { getFriendsListAction, getFriendRequestsAction } from '@/actions/social';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import { getSavedAvatarId } from '@/lib/avatars';
import { calculateDailyWins, calculateWinStreak } from '@/lib/rank';
import { publicConfig } from '@/lib/public-config';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import type { SessionUser } from '@/types/auth';

interface DashboardHeaderProps {
  user: SessionUser;
  displayName?: string;
  showMinigameBack?: boolean;
  onBackToMinigame?: () => void;
  reputation?: ReputationSummary | null;
}

let lastKnownReputation: ReputationSummary | null = null;

export function DashboardHeader({
  user,
  displayName,
  showMinigameBack,
  onBackToMinigame,
  reputation,
}: DashboardHeaderProps) {
  const shownName = displayName ?? user.name ?? user.email;
  const [profileOpen, setProfileOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [publicProfileTarget, setPublicProfileTarget] = useState<string | null>(null);
  const [challengeTarget, setChallengeTarget] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState(() => getSavedAvatarId());
  const [onlineFriendsCount, setOnlineFriendsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [currentReputation, setCurrentReputation] = useState<ReputationSummary | null>(
    () => reputation ?? lastKnownReputation,
  );

  useEffect(() => {
    if (reputation) {
      lastKnownReputation = reputation;
      setCurrentReputation(reputation);
    } else if (!lastKnownReputation) {
      fetchMyAchievementsAction().then((res) => {
        if (res.ok) {
          lastKnownReputation = res.reputation;
          setCurrentReputation(res.reputation);
        }
      });
    }
  }, [reputation]);

  useEffect(() => {
    const onAvatar = (e: Event) => {
      const d = (e as CustomEvent<{ avatarId: string }>).detail;
      if (d?.avatarId) setAvatarId(d.avatarId);
    };
    const onProfile = (e: Event) => {
      const d = (e as CustomEvent<{ gamertag: string }>).detail;
      if (d?.gamertag) setPublicProfileTarget(d.gamertag);
    };
    window.addEventListener('ebartex-avatar-changed', onAvatar);
    window.addEventListener('ebartex-open-player-profile', onProfile);
    return () => {
      window.removeEventListener('ebartex-avatar-changed', onAvatar);
      window.removeEventListener('ebartex-open-player-profile', onProfile);
    };
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      const [friendsRes, reqRes] = await Promise.all([getFriendsListAction(), getFriendRequestsAction()]);
      if (friendsRes.ok && friendsRes.data) {
        setOnlineFriendsCount(friendsRes.data.filter((f) => f.presence === 'online' || f.presence === 'in_game').length);
      }
      if (reqRes.ok && reqRes.data) setPendingRequestsCount(reqRes.data.length);
    };
    void fetchCounts();
  }, [friendsOpen]);

  const dailyWins = calculateDailyWins(currentReputation);
  const winStreak = calculateWinStreak(currentReputation);

  return (
    <>
    <header className="sticky top-0 z-40 w-full font-sans text-white">
      <div className="relative border-b border-white/10 bg-gradient-to-b from-black/55 via-black/25 to-transparent px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label={`Apri il profilo di ${shownName}`}
              className="group flex min-w-0 items-center gap-2.5 rounded-full border border-white/12 bg-black/40 py-1 pl-1 pr-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md transition hover:border-primary/40 hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ProfileRankBadge
                avatarId={avatarId}
                gamertag={shownName}
                wins={dailyWins}
                winStreak={winStreak}
                onFire={winStreak >= 3}
                hidePill
                interactive={false}
              />
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm font-black tracking-wide text-white sm:text-base">
                  {shownName}
                </span>
                {winStreak >= 3 ? (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    <Flame className="h-3 w-3" />
                    In fiamme ×{winStreak}
                  </span>
                ) : (
                  <span className="mt-0.5 hidden text-[10px] font-bold uppercase tracking-wider text-white/45 sm:block">
                    Profilo
                  </span>
                )}
              </span>
            </button>
            {showMinigameBack && onBackToMinigame && (
              <button
                type="button"
                onClick={onBackToMinigame}
                aria-label="Torna al mini-gioco"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-primary hover:border-primary/40 hover:bg-primary/15"
              >
                <Gamepad2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <a
            href={publicConfig.app.mainSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Torna al marketplace Ebartex"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/80 shadow-sm backdrop-blur-md transition hover:border-white/30 hover:bg-white/18 hover:text-white sm:px-3.5 sm:text-xs"
          >
            <span className="hidden sm:inline">Ebartex</span>
            <span className="sm:hidden">Shop</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </a>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Link
            href={DEFAULT_TOURNAMENTS_PATH}
            aria-label="Tornei"
            className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-2.5 py-1 shadow-[0_10px_28px_-16px_rgba(0,0,0,0.9)] backdrop-blur-md transition hover:border-primary/35 hover:bg-black/50 sm:gap-2.5 sm:px-3 sm:py-1.5"
          >
            <span className="hidden sm:inline-flex">
              <BrxHeaderLogo variant="light" size="compact" linked={false} />
            </span>
            <span className="font-display text-sm font-black uppercase tracking-[0.16em] text-primary sm:text-lg">
              Tournaments
            </span>
          </Link>
        </div>
      </div>

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} gamertag={shownName} ebartexUsername={user.name} initialReputation={currentReputation} />
      <FriendsDrawer open={friendsOpen} onClose={() => setFriendsOpen(false)} onOpenProfile={setPublicProfileTarget} onChallenge={setChallengeTarget} myGamertag={shownName} myEbartexUsername={user.name} />
      <PublicProfileModal gamertag={publicProfileTarget} open={Boolean(publicProfileTarget)} onClose={() => setPublicProfileTarget(null)} onChallenge={setChallengeTarget} />
      <DirectChallengeModal targetGamertag={challengeTarget} open={Boolean(challengeTarget)} onClose={() => setChallengeTarget(null)} />
      <IncomingChallengeToast />
    </header>
    <GameNavRail
      friendsOpen={friendsOpen}
      onOpenFriends={() => setFriendsOpen(true)}
      onlineFriendsCount={onlineFriendsCount}
      pendingRequestsCount={pendingRequestsCount}
    />
    </>
  );
}
