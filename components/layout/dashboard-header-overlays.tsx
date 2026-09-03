'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { ReputationSummary } from '@/lib/data/player-api-client';

const ProfileDrawer = dynamic(
  () => import('@/components/feature/profile/profile-drawer').then((module) => module.ProfileDrawer),
  { ssr: false },
);
const PublicProfileModal = dynamic(
  () => import('@/components/feature/profile/public-profile-modal').then((module) => module.PublicProfileModal),
  { ssr: false },
);
const FriendsDrawer = dynamic(
  () => import('@/components/feature/social/friends-drawer').then((module) => module.FriendsDrawer),
  { ssr: false },
);
const DirectChallengeModal = dynamic(
  () => import('@/components/feature/social/direct-challenge-modal').then((module) => module.DirectChallengeModal),
  { ssr: false },
);
const IncomingChallengeToast = dynamic(
  () => import('@/components/feature/social/incoming-challenge-toast').then((module) => module.IncomingChallengeToast),
  { ssr: false },
);

interface DashboardHeaderOverlaysProps {
  profileOpen: boolean;
  friendsOpen: boolean;
  publicProfileTarget: string | null;
  challengeTarget: string | null;
  gamertag: string;
  ebartexUsername?: string | null;
  reputation: ReputationSummary | null;
  onCloseProfile: () => void;
  onCloseFriends: () => void;
  onOpenProfile: (gamertag: string) => void;
  onChallenge: (gamertag: string) => void;
  onClosePublicProfile: () => void;
  onCloseChallenge: () => void;
}

/** Carica drawer e modali solo quando servono; il poll sfide parte dopo il primo paint. */
export function DashboardHeaderOverlays({
  profileOpen,
  friendsOpen,
  publicProfileTarget,
  challengeTarget,
  gamertag,
  ebartexUsername,
  reputation,
  onCloseProfile,
  onCloseFriends,
  onOpenProfile,
  onChallenge,
  onClosePublicProfile,
  onCloseChallenge,
}: DashboardHeaderOverlaysProps) {
  const [backgroundServicesReady, setBackgroundServicesReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setBackgroundServicesReady(true), 1_200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {profileOpen ? (
        <ProfileDrawer open onClose={onCloseProfile} gamertag={gamertag} initialReputation={reputation} />
      ) : null}
      {friendsOpen ? (
        <FriendsDrawer
          open
          onClose={onCloseFriends}
          onOpenProfile={onOpenProfile}
          onChallenge={onChallenge}
          myGamertag={gamertag}
          myEbartexUsername={ebartexUsername}
        />
      ) : null}
      {publicProfileTarget ? (
        <PublicProfileModal
          gamertag={publicProfileTarget}
          open
          onClose={onClosePublicProfile}
          onChallenge={onChallenge}
        />
      ) : null}
      {challengeTarget ? (
        <DirectChallengeModal
          targetGamertag={challengeTarget}
          open
          onClose={onCloseChallenge}
        />
      ) : null}
      {backgroundServicesReady ? <IncomingChallengeToast /> : null}
    </>
  );
}
