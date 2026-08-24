'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, Search, Settings, Users, X } from 'lucide-react';
import {
  cancelFriendRequestAction,
  getFriendRequestsAction,
  getFriendsListAction,
  removeFriendAction,
  respondFriendRequestAction,
} from '@/actions/social';
import { getRecentOpponentsAction } from '@/actions/social-recent';
import type { FriendRequestItem, FriendSummary, RecentOpponent } from '@/types/social';
import { FriendSearch } from './friend-search';
import { FriendRequestsList } from './friend-requests-list';
import { FriendsListPanel } from './friends-list-panel';
import { FriendQrModal } from './friend-qr-modal';
import { SocialTabButton } from './social-tab-button';
import { SocialErrorNotice } from './social-error-notice';
import { SocialSettingsModal } from './social-settings-modal';

interface FriendsDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenProfile: (gamertag: string) => void;
  onChallenge: (gamertag: string) => void;
  myGamertag?: string | null;
  myEbartexUsername?: string | null;
}

type TabType = 'friends' | 'requests' | 'search';

export function FriendsDrawer({
  open,
  onClose,
  onOpenProfile,
  onChallenge,
  myGamertag,
  myEbartexUsername,
}: FriendsDrawerProps) {
  const [tab, setTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [recentOpponents, setRecentOpponents] = useState<RecentOpponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !settingsOpen && !qrOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, settingsOpen, qrOpen, onClose]);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [friendsRes, reqRes, recentRes] = await Promise.all([
        getFriendsListAction(),
        getFriendRequestsAction(),
        getRecentOpponentsAction(),
      ]);
      if (friendsRes.ok && friendsRes.data) setFriends(friendsRes.data);
      if (reqRes.ok && reqRes.data) setRequests(reqRes.data);
      if (recentRes.ok && recentRes.data) setRecentOpponents(recentRes.data);
      const error = !friendsRes.ok ? friendsRes.error : !reqRes.ok ? reqRes.error : null;
      if (error) setLoadError(error);
    } catch {
      setLoadError('Impossibile caricare amici e richieste.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void loadData();
  }, [open]);

  if (!open || !mounted) return null;

  const handleRemoveFriend = async (gamertag: string) => {
    const result = await removeFriendAction(gamertag);
    if (!result.ok) {
      setLoadError(result.error ?? 'Impossibile rimuovere l’amico.');
      return;
    }
    await loadData();
  };

  const handleRespondRequest = async (requestId: string, action: 'accept' | 'decline') => {
    const result = await respondFriendRequestAction(requestId, action);
    if (!result.ok) {
      setLoadError(result.error ?? 'Impossibile rispondere alla richiesta.');
      return;
    }
    await loadData();
  };

  const handleCancelRequest = async (requestId: string) => {
    const result = await cancelFriendRequestAction(requestId);
    if (!result.ok) {
      setLoadError(result.error ?? 'Impossibile annullare la richiesta.');
      return;
    }
    await loadData();
  };

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[900]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Amici e Duellanti"
        className="profile-drawer-panel absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-white/10 bg-[#0a0f1d] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="relative flex items-center justify-between border-b border-white/10 px-7 py-5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(280px_120px_at_0%_0%,rgba(255,115,0,0.16),transparent_70%)]"
          />
          <div className="relative flex items-center gap-3">
            <span className="swords-emblem grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#FF7300] to-[#e0564d] text-white shadow-lg shadow-orange-950/40">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Social & Duelli</p>
              <h2 className="font-display text-xl font-black tracking-tight text-white">Amici & Giocatori</h2>
            </div>
          </div>
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              aria-label="Mostra il tuo QR amici"
              title="Il tuo QR amici"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <QrCode className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Impostazioni Social"
              title="Impostazioni Social e Profilo Ebartex"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="border-b border-white/10 px-7 pt-3">
          <nav className="flex space-x-3">
            <SocialTabButton active={tab === 'friends'} onClick={() => setTab('friends')} label="Amici" badge={friends.length} />
            <SocialTabButton
              active={tab === 'requests'}
              onClick={() => setTab('requests')}
              label="Richieste"
              badge={requests.length > 0 ? requests.length : undefined}
              badgeHighlight={requests.some((r) => r.direction === 'incoming')}
            />
            <SocialTabButton active={tab === 'search'} onClick={() => setTab('search')} label="Cerca" icon={Search} />
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#080d1a] px-7 py-6">
          {loadError && <SocialErrorNotice message={loadError} />}
          {tab === 'friends' && (
            <FriendsListPanel
              loading={loading}
              friends={friends}
              requests={requests}
              recentOpponents={recentOpponents}
              onSearch={() => setTab('search')}
              onShowQr={() => setQrOpen(true)}
              onOpenProfile={onOpenProfile}
              onChallenge={(gamertag) => {
                if (myGamertag && gamertag.trim().toLowerCase() === myGamertag.trim().toLowerCase()) {
                  return;
                }
                onChallenge(gamertag);
              }}
              onRemove={handleRemoveFriend}
              onRecentAdded={() => void loadData()}
              myGamertag={myGamertag}
            />
          )}

          {tab === 'requests' && (
            <FriendRequestsList
              requests={requests}
              onRespond={handleRespondRequest}
              onCancel={handleCancelRequest}
              onOpenProfile={onOpenProfile}
            />
          )}

          {tab === 'search' && (
            <FriendSearch onOpenProfile={onOpenProfile} friendGamertags={friends.map((friend) => friend.gamertag)} pendingGamertags={requests.map((request) => request.gamertag)} />
          )}
        </div>
      </aside>

      <SocialSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        gamertag={myGamertag}
        ebartexUsername={myEbartexUsername}
      />
      <FriendQrModal open={qrOpen} onClose={() => setQrOpen(false)} gamertag={myGamertag} />
    </div>,
    document.body,
  );
}
