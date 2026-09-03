'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Gamepad2 } from 'lucide-react';
import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';
import { DashboardHeaderOverlays } from '@/components/layout/dashboard-header-overlays';
import { GameNavRail } from '@/components/layout/game-nav-rail';
import { ProfileRankBadge } from '@/components/feature/profile/profile-rank-badge';
import { NotificationBell } from '@/components/feature/notifications/NotificationBell';
import { fetchMyAchievementsAction } from '@/actions/achievements';
import { getFriendsListAction, getFriendRequestsAction } from '@/actions/social';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import { getSavedAvatarId, getUnlockedAvatarId } from '@/lib/avatars';
import { calculateDailyWins, calculateWinStreak } from '@/lib/rank';
import { publicConfig } from '@/lib/public-config';
import { cn } from '@/lib/utils';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import type { SessionUser } from '@/types/auth';
import type { NotificationSnapshot } from '@/types/notification';

const HEADER_GLASS_ON = 24;
const HEADER_GLASS_OFF = 8;
interface DashboardHeaderProps {
  user: SessionUser;
  displayName?: string;
  showMinigameBack?: boolean;
  onBackToMinigame?: () => void;
  /** Apre la Sala Arcade storica come superficie secondaria della lobby. */
  onOpenMinigame?: () => void;
  reputation?: ReputationSummary | null;
  initialNotifications: NotificationSnapshot;
  /** Evita di richiedere nuovamente gli amici già inclusi nella lobby RSC. */
  initialOnlineFriendsCount?: number;
}
let lastKnownReputation: ReputationSummary | null = null;

export function DashboardHeader({
  user,
  displayName,
  showMinigameBack,
  onBackToMinigame,
  onOpenMinigame,
  reputation,
  initialNotifications,
  initialOnlineFriendsCount,
}: DashboardHeaderProps) {
  const shownName = displayName ?? user.name ?? user.email;
  const [profileOpen, setProfileOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [publicProfileTarget, setPublicProfileTarget] = useState<string | null>(null);
  const [challengeTarget, setChallengeTarget] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState(() => getSavedAvatarId());
  const [onlineFriendsCount, setOnlineFriendsCount] = useState(initialOnlineFriendsCount ?? 0);
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
    let animationFrame: number | null = null;

    const updateScrolledState = () => {
      const y = window.scrollY;
      const prev = scrolledRef.current;
      const next = prev ? y > HEADER_GLASS_OFF : y > HEADER_GLASS_ON;
      if (next === prev) return;
      scrolledRef.current = next;
      setScrolled(next);
    };

    // Allinea il cambio di stato al frame successivo: la transizione CSS non
    // compete con il lavoro sincrono dell'evento scroll.
    const onScroll = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        updateScrolledState();
      });
    };

    updateScrolledState();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!friendsOpen && initialOnlineFriendsCount !== undefined) {
        const reqRes = await getFriendRequestsAction();
        if (reqRes.ok && reqRes.data) setPendingRequestsCount(reqRes.data.length);
        return;
      }
      const [friendsRes, reqRes] = await Promise.all([
        getFriendsListAction(),
        getFriendRequestsAction(),
      ]);
      if (friendsRes.ok && friendsRes.data) {
        setOnlineFriendsCount(
          friendsRes.data.filter((friend) =>
            friend.presence === 'online' || friend.presence === 'in_game'
          ).length,
        );
      }
      if (reqRes.ok && reqRes.data) setPendingRequestsCount(reqRes.data.length);
    };
    void fetchCounts();
  }, [friendsOpen, initialOnlineFriendsCount]);

  const dailyWins = calculateDailyWins(currentReputation);
  const winStreak = calculateWinStreak(currentReputation);
  const visibleAvatarId = getUnlockedAvatarId(
    avatarId,
    currentReputation?.qualifiedMatches30m ?? 0,
  );

  return (
    <>
      <header className="relative sticky top-0 z-40 w-full overflow-visible font-sans text-white">
        <div className="relative z-10 flex items-center justify-between gap-3 px-3 pb-5 pt-3 sm:px-5 sm:pt-3.5">
          <Link
            href={DEFAULT_TOURNAMENTS_PATH}
            aria-label="Tornei"
            className="header-scroll-brand min-w-0"
            data-compact={scrolled ? 'true' : 'false'}
          >
            <span className="header-scroll-brand-logo hidden sm:inline-flex">
              <BrxHeaderLogo variant="light" size="compact" linked={false} />
            </span>
            <span className="header-scroll-brand-title truncate font-display font-black uppercase text-primary">
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
            {onOpenMinigame && (
              <button
                type="button"
                onClick={onOpenMinigame}
                aria-label="Apri Sala Arcade"
                title="Apri Sala Arcade"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide transition-colors sm:px-3',
                  scrolled
                    ? 'border border-slate-900/10 bg-white/50 text-slate-700 hover:bg-white/80 hover:text-primary'
                    : 'border border-white/15 bg-white/10 text-white/80 hover:border-primary/40 hover:bg-primary/15 hover:text-white',
                )}
              >
                <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Sala Arcade</span>
              </button>
            )}
            <a
              href={publicConfig.app.mainSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Torna al marketplace Ebartex"
              title="Torna al marketplace Ebartex"
              className="header-marketplace-glass inline-flex items-center gap-1 text-[11px] font-bold tracking-wide sm:text-xs"
            >
              <span>Ebartex</span>
              <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
            </a>
            <NotificationBell initialNotifications={initialNotifications} />
            <ProfileRankBadge
              avatarId={visibleAvatarId}
              gamertag={shownName}
              wins={dailyWins}
              winStreak={winStreak}
              onFire={winStreak >= 3}
              onClick={() => setProfileOpen(true)}
            />
          </div>
        </div>

        <DashboardHeaderOverlays
          profileOpen={profileOpen}
          friendsOpen={friendsOpen}
          publicProfileTarget={publicProfileTarget}
          challengeTarget={challengeTarget}
          gamertag={shownName}
          ebartexUsername={user.username}
          reputation={currentReputation}
          onCloseProfile={() => setProfileOpen(false)}
          onCloseFriends={() => setFriendsOpen(false)}
          onOpenProfile={setPublicProfileTarget}
          onChallenge={setChallengeTarget}
          onClosePublicProfile={() => setPublicProfileTarget(null)}
          onCloseChallenge={() => setChallengeTarget(null)}
        />
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
