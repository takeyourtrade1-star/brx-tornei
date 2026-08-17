'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Gamepad2, Layers, Swords } from 'lucide-react';
import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';
import { ProfileDrawer } from '@/components/feature/profile/profile-drawer';
import { ProfileRankBadge } from '@/components/feature/profile/profile-rank-badge';
import { fetchMyAchievementsAction } from '@/actions/achievements';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import { getSavedAvatarId } from '@/lib/avatars';
import { calculateDailyWins, calculateWinStreak } from '@/lib/rank';
import { publicConfig } from '@/lib/public-config';
import { cn } from '@/lib/utils';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import type { SessionUser } from '@/types/auth';

interface DashboardHeaderProps {
  user: SessionUser;
  /** Identità mostrata nel chip profilo: il gamertag torneo, quando noto. */
  displayName?: string;
  /** Mostra il pulsante icona per tornare al minigioco (vista semplice desktop). */
  showMinigameBack?: boolean;
  onBackToMinigame?: () => void;
  /** Reputazione già disponibile sulla pagina: passata al drawer per evitare fetch. */
  reputation?: ReputationSummary | null;
}

/** Cache client in-memory della reputazione per evitare sfarfallii durante la navigazione. */
let lastKnownReputation: ReputationSummary | null = null;

/**
 * Header dashboard tornei — Mazzi e Partite sono le azioni primarie; profilo,
 * ritorno al minigioco e logout restano controlli secondari e più discreti.
 * Il widget profilo mostra l'avatar gaming in un cerchio di grado dorato
 * con stelline simmetriche e gamertag centrato.
 */
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
  const [avatarId, setAvatarId] = useState(() => getSavedAvatarId());
  const [currentReputation, setCurrentReputation] = useState<ReputationSummary | null>(
    () => reputation ?? lastKnownReputation,
  );

  // Sincronizza se la prop cambia dall'SSR
  useEffect(() => {
    if (reputation) {
      lastKnownReputation = reputation;
      setCurrentReputation(reputation);
    } else if (!lastKnownReputation) {
      // Fetch in background se la pagina non ha fornito la reputazione
      fetchMyAchievementsAction().then((res) => {
        if (res.ok) {
          lastKnownReputation = res.reputation;
          setCurrentReputation(res.reputation);
        }
      });
    }
  }, [reputation]);

  // Ascolta aggiornamenti dell'avatar
  useEffect(() => {
    const handleAvatarChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ avatarId: string }>;
      if (customEvent.detail?.avatarId) {
        setAvatarId(customEvent.detail.avatarId);
      }
    };
    window.addEventListener('ebartex-avatar-changed', handleAvatarChange);
    return () => window.removeEventListener('ebartex-avatar-changed', handleAvatarChange);
  }, []);

  // Ascolta aggiornamenti della reputazione (es. fine partita)
  useEffect(() => {
    const handleReputationUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ reputation: ReputationSummary }>;
      if (customEvent.detail?.reputation) {
        lastKnownReputation = customEvent.detail.reputation;
        setCurrentReputation(customEvent.detail.reputation);
      }
    };
    window.addEventListener('ebartex-reputation-updated', handleReputationUpdate);
    return () => window.removeEventListener('ebartex-reputation-updated', handleReputationUpdate);
  }, []);

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

          {/* Widget Profilo con Cerchio di Grado e Stelle Pixel-Perfect */}
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
        initialReputation={currentReputation}
      />
    </header>
  );
}

function HeaderPrimarySegment({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Layers;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex min-h-[38px] min-w-0 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-center transition-all duration-200 sm:min-w-[8.75rem]',
        active
          ? 'border border-white/30 bg-gradient-to-r from-[#FF7300] to-[#e0564d] text-white shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.5),0_4px_16px_-2px_rgba(255,115,0,0.6)] font-black'
          : 'text-white/75 hover:bg-white/10 hover:text-white font-bold',
      )}
    >
      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors',
          active ? 'bg-white/25 text-white' : 'bg-white/10 text-white/80 group-hover:bg-white/20 group-hover:text-white',
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <span className="min-w-0 truncate text-xs uppercase tracking-wide">{label}</span>
    </Link>
  );
}
