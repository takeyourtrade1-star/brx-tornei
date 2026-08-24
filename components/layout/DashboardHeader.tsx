'use client';

import { useEffect, useState } from 'react';
import { Gamepad2 } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full overflow-visible font-sans text-white">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 pb-5 pt-3 sm:px-6">
        <div className="flex items-center justify-start gap-2">
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

        <div className="flex min-w-0 items-center justify-center gap-1.5 sm:gap-2">
          <BrxHeaderLogo href={DEFAULT_TOURNAMENTS_PATH} ariaLabel="Tornei" variant="light" />
          <span className="truncate font-sans text-base font-black uppercase tracking-wide text-primary sm:text-xl">
            Tournaments
          </span>
        </div>

        <div className="flex items-center justify-end">
          <a
            href={publicConfig.app.mainSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Torna al marketplace Ebartex"
            title="Torna al marketplace Ebartex"
            className="max-w-[9.5rem] text-right text-[11px] font-bold leading-snug text-white/70 transition hover:text-white sm:max-w-none sm:text-xs"
          >
            torna su Ebartex
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
