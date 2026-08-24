'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Gamepad2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import type { SessionUser } from '@/types/auth';

const HEADER_GLASS_ON = 24;
const HEADER_GLASS_OFF = 8;

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
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);

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
    const onScroll = () => {
      const y = window.scrollY;
      const prev = scrolledRef.current;
      const next = prev ? y > HEADER_GLASS_OFF : y > HEADER_GLASS_ON;
      if (next === prev) return;
      scrolledRef.current = next;
      setScrolled(next);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
      <header className="relative sticky top-0 z-40 w-full overflow-visible font-sans text-white">
        <div
          className="header-brand-glass"
          data-expanded={scrolled ? 'true' : 'false'}
          aria-hidden
        />
        <div className="relative z-10 flex items-center justify-between gap-3 px-3 pb-5 pt-3 sm:px-5 sm:pt-3.5">
          <Link
            href={DEFAULT_TOURNAMENTS_PATH}
            aria-label="Tornei"
            className="inline-flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="hidden sm:inline-flex">
              <BrxHeaderLogo variant="dark" size="compact" linked={false} />
            </span>
            <span className="truncate font-display text-sm font-black uppercase tracking-[0.14em] text-primary sm:text-lg">
              Tournaments
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
            {showMinigameBack && onBackToMinigame && (
              <button
                type="button"
                onClick={onBackToMinigame}
                aria-label="Torna al mini-gioco"
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-full text-primary transition-colors',
                  scrolled
                    ? 'border border-slate-900/10 bg-white/50 hover:bg-white/80'
                    : 'border border-white/15 bg-white/10 hover:border-primary/40 hover:bg-primary/15',
                )}
              >
                <Gamepad2 className="h-4 w-4" />
              </button>
            )}
            <a
              href={publicConfig.app.mainSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Torna al marketplace Ebartex"
              title="Torna al marketplace Ebartex"
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-bold tracking-wide transition sm:text-xs',
                scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/40 hover:text-white/80',
              )}
            >
              <span>Ebartex</span>
              <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
            </a>
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
