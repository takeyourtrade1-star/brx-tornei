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
import { cn } from '@/lib/utils';

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
  const [isScrolled, setIsScrolled] = useState(false);
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
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header
      className={cn(
        'sticky top-0 z-40 w-full font-sans transition-all duration-300 ease-out',
        isScrolled
          ? 'border-b border-slate-200/90 bg-white/85 text-slate-900 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent text-white',
      )}
    >
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-2.5 px-4 py-2 sm:flex-nowrap sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-visible py-0.5 sm:flex-none">
          <BrxHeaderLogo href={DEFAULT_TOURNAMENTS_PATH} ariaLabel="Tornei" />
          <span className="font-sans text-xl font-black uppercase tracking-wide text-primary sm:text-2xl">
            Tournaments
          </span>
        </div>

        <nav
          aria-label="Navigazione principale tornei"
          className={cn(
            'order-3 grid w-full grid-cols-3 gap-1 rounded-full p-1.5 transition-all duration-300 backdrop-blur-xl sm:order-none sm:ml-auto sm:flex sm:w-auto sm:gap-1.5',
            isScrolled
              ? 'border border-slate-300/80 bg-slate-100/85 shadow-inner'
              : 'border border-white/20 bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_25px_-6px_rgba(0,0,0,0.4)]',
          )}
        >
          <HeaderPrimarySegment href="/mazzi" label="I miei mazzi" icon={Layers} active={pathname.startsWith('/mazzi')} scrolled={isScrolled} />
          <HeaderPrimarySegment href="/partite" label="Le mie partite" icon={Swords} active={pathname.startsWith('/partite')} scrolled={isScrolled} />
          <button
            type="button"
            onClick={() => setFriendsOpen(true)}
            aria-label="Apri amici e duellanti"
            className={cn(
              'group flex min-h-[38px] min-w-0 items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-center transition-all duration-200 sm:min-w-[7.5rem]',
              friendsOpen
                ? 'border border-white/30 bg-gradient-to-r from-[#FF7300] to-[#e0564d] text-white shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.5),0_4px_16px_-2px_rgba(255,115,0,0.6)] font-black'
                : isScrolled
                  ? 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-950 font-bold'
                  : 'text-white/75 hover:bg-white/10 hover:text-white font-bold',
            )}
          >
            <span
              className={cn(
                'relative grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors',
                friendsOpen
                  ? 'bg-white/25 text-white'
                  : isScrolled
                    ? 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300 group-hover:text-slate-900'
                    : 'bg-white/10 text-white/80 group-hover:bg-white/20 group-hover:text-white',
              )}
            >
              <Users className="h-3.5 w-3.5" strokeWidth={2.4} />
              {onlineFriendsCount > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              )}
            </span>
            <span className="min-w-0 truncate text-xs uppercase tracking-wide">Amici</span>
            {pendingRequestsCount > 0 && (
              <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white shadow-sm">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </nav>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-2 sm:ml-0 sm:gap-3">
          <a
            href={publicConfig.app.mainSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Torna al marketplace Ebartex"
            title="Torna al marketplace Ebartex"
            className={cn(
              'group relative flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-sm',
              isScrolled
                ? 'border border-slate-300/90 bg-white/95 text-slate-800 hover:border-orange-500/50 hover:bg-orange-500/[0.06] hover:text-orange-600 hover:shadow-md'
                : 'border border-white/20 bg-white/[0.12] text-white backdrop-blur-md hover:border-orange-400/60 hover:bg-white/20 hover:text-white hover:shadow-[0_0_15px_rgba(255,115,0,0.35)]',
            )}
          >
            <span
              className={cn(
                'grid h-5 w-5 place-items-center rounded-full transition-transform duration-200 group-hover:-translate-x-0.5',
                isScrolled ? 'bg-slate-100 text-slate-700 group-hover:bg-orange-500/15 group-hover:text-orange-600' : 'bg-white/15 text-white',
              )}
            >
              <ArrowLeft className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span>Ebartex</span>
          </a>

          {showMinigameBack && onBackToMinigame && (
            <button
              type="button"
              onClick={onBackToMinigame}
              aria-label="Torna al mini-gioco"
              className={cn(
                'grid h-9 w-9 place-items-center rounded-full transition',
                isScrolled
                  ? 'border border-slate-300 bg-white/90 text-primary shadow-sm hover:border-slate-400 hover:bg-slate-50'
                  : 'border border-white/15 bg-white/10 text-primary hover:border-primary/40 hover:bg-primary/15',
              )}
            >
              <Gamepad2 className="h-4 w-4" />
            </button>
          )}

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

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} gamertag={shownName} ebartexUsername={user.name} initialReputation={currentReputation} />
      <FriendsDrawer open={friendsOpen} onClose={() => setFriendsOpen(false)} onOpenProfile={setPublicProfileTarget} onChallenge={setChallengeTarget} myGamertag={shownName} myEbartexUsername={user.name} />
      <PublicProfileModal gamertag={publicProfileTarget} open={Boolean(publicProfileTarget)} onClose={() => setPublicProfileTarget(null)} onChallenge={setChallengeTarget} />
      <DirectChallengeModal targetGamertag={challengeTarget} open={Boolean(challengeTarget)} onClose={() => setChallengeTarget(null)} />
      <IncomingChallengeToast />
    </header>
  );
}
