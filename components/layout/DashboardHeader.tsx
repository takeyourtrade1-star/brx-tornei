'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
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
      <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-5">
        <div className="flex items-center gap-2 py-1">
          <ProfileRankBadge
            avatarId={avatarId}
            gamertag={shownName}
            wins={dailyWins}
            winStreak={winStreak}
            onFire={winStreak >= 3}
            onClick={() => setProfileOpen(true)}
          />
          {showMinigameBack && onBackToMinigame && (
            <button
              type="button"
              onClick={onBackToMinigame}
              aria-label="Torna al mini-gioco"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-primary hover:border-primary/40 hover:bg-primary/15"
            >
              <Gamepad2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <BrxHeaderLogo href={DEFAULT_TOURNAMENTS_PATH} ariaLabel="Tornei" variant="light" />
            <span className="hidden truncate font-sans text-lg font-black uppercase tracking-wide text-primary sm:inline sm:text-xl">
              Tournaments
            </span>
          </div>
          <a
            href={publicConfig.app.mainSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Torna al marketplace Ebartex"
            title="Torna al marketplace Ebartex"
            className="group relative flex h-9 items-center gap-2 rounded-full border border-white/20 bg-white/[0.12] px-3.5 text-xs font-black uppercase tracking-wider text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:border-orange-400/60 hover:bg-white/20 hover:shadow-[0_0_15px_rgba(255,115,0,0.35)]"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-white transition-transform duration-200 group-hover:-translate-x-0.5">
              <ArrowLeft className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span className="hidden sm:inline">Ebartex</span>
          </a>
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
