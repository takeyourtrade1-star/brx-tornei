'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Gamepad2, Layers, Swords, Users } from 'lucide-react';
import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';
import { HeaderPrimarySegment } from '@/components/layout/header-primary-segment';
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
  const pathname = usePathname();
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
    const handleAvatarChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ avatarId: string }>;
      if (customEvent.detail?.avatarId) setAvatarId(customEvent.detail.avatarId);
    };
    window.addEventListener('ebartex-avatar-changed', handleAvatarChange);
    return () => window.removeEventListener('ebartex-avatar-changed', handleAvatarChange);
  }, []);

  useEffect(() => {
    const handleOpenProfile = (e: Event) => {
      const customEvent = e as CustomEvent<{ gamertag: string }>;
      if (customEvent.detail?.gamertag) setPublicProfileTarget(customEvent.detail.gamertag);
    };
    window.addEventListener('ebartex-open-player-profile', handleOpenProfile);
    return () => window.removeEventListener('ebartex-open-player-profile', handleOpenProfile);
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      const [friendsRes, reqRes] = await Promise.all([
        getFriendsListAction(),
        getFriendRequestsAction(),
      ]);
      if (friendsRes.ok && friendsRes.data) {
        const count = friendsRes.data.filter((f) => f.presence === 'online' || f.presence === 'in_game').length;
        setOnlineFriendsCount(count);
      }
      if (reqRes.ok && reqRes.data) {
        setPendingRequestsCount(reqRes.data.length);
      }
    };
    void fetchCounts();
  }, [friendsOpen]);

  const dailyWins = calculateDailyWins(currentReputation);
  const winStreak = calculateWinStreak(currentReputation);

  return (
    <header className="sticky top-0 z-40 w-full font-sans text-white">
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-2.5 px-4 py-2 sm:flex-nowrap sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-visible py-0.5 sm:flex-none">
          <BrxHeaderLogo href={DEFAULT_TOURNAMENTS_PATH} ariaLabel="Tornei" />
          <span className="font-sans text-xl font-black uppercase tracking-wide text-primary sm:text-2xl">
            Tournaments
          </span>
        </div>

        <nav
          aria-label="Navigazione principale tornei"
          className="order-3 grid w-full grid-cols-2 gap-1 rounded-full border border-white/20 bg-white/[0.08] p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_25px_-6px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:order-none sm:ml-auto sm:flex sm:w-auto sm:gap-1.5"
        >
          <HeaderPrimarySegment
            href="/mazzi"
            label="I miei mazzi"
            icon={Layers}
            active={pathname.startsWith('/mazzi')}
          />
          <HeaderPrimarySegment
            href="/partite"
            label="Le mie partite"
            icon={Swords}
            active={pathname.startsWith('/partite')}
          />
        </nav>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-2 sm:ml-0 sm:gap-3">
          <a
            href={publicConfig.app.mainSiteUrl}
            aria-label="Torna su Ebartex"
            title="Torna su Ebartex"
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 text-xs font-bold uppercase tracking-wide text-white/80 transition hover:border-primary/40 hover:bg-primary/15 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden lg:inline">Ebartex</span>
          </a>

          {showMinigameBack && onBackToMinigame && (
            <button
              type="button"
              onClick={onBackToMinigame}
              aria-label="Torna al mini-gioco"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-primary transition hover:border-primary/40 hover:bg-primary/15"
            >
              <Gamepad2 className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setFriendsOpen(true)}
            aria-label="Apri amici e duellanti"
            className="relative flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 text-xs font-bold uppercase tracking-wide text-white/90 transition hover:border-primary/40 hover:bg-primary/15 hover:text-white"
          >
            <Users className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Amici</span>
            {onlineFriendsCount > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white/20" />
            )}
            {pendingRequestsCount > 0 && (
              <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <div className="relative flex items-center justify-center py-1 sm:py-1.5">
            <ProfileRankBadge
              avatarId={avatarId}
              gamertag={shownName}
              wins={dailyWins}
              winStreak={winStreak}
              onFire={winStreak >= 3}
              onClick={() => setProfileOpen(true)}
            />
          </div>
        </div>
      </div>

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        gamertag={shownName}
        ebartexUsername={user.name}
        initialReputation={currentReputation}
      />

      <FriendsDrawer
        open={friendsOpen}
        onClose={() => setFriendsOpen(false)}
        onOpenProfile={(tag) => setPublicProfileTarget(tag)}
        onChallenge={(tag) => setChallengeTarget(tag)}
        myGamertag={shownName}
        myEbartexUsername={user.name}
      />

      <PublicProfileModal
        gamertag={publicProfileTarget}
        open={Boolean(publicProfileTarget)}
        onClose={() => setPublicProfileTarget(null)}
        onChallenge={(tag) => setChallengeTarget(tag)}
      />

      <DirectChallengeModal
        targetGamertag={challengeTarget}
        open={Boolean(challengeTarget)}
        onClose={() => setChallengeTarget(null)}
      />

      <IncomingChallengeToast />
    </header>
  );
}
