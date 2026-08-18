'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Settings, UserPlus, Users, X } from 'lucide-react';
import {
  cancelFriendRequestAction,
  getFriendRequestsAction,
  getFriendsListAction,
  removeFriendAction,
  respondFriendRequestAction,
} from '@/actions/social';
import type { FriendRequestItem, FriendSummary } from '@/types/social';
import { FriendRow } from './friend-row';
import { FriendSearch } from './friend-search';
import { FriendRequestsList } from './friend-requests-list';
import { SocialTabButton } from './social-tab-button';
import { SocialSettingsModal } from './social-settings-modal';

interface FriendsDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenProfile: (gamertag: string) => void;
  onChallenge: (gamertag: string) => void;
  myGamertag?: string | null;
}

type TabType = 'friends' | 'requests' | 'search';

export function FriendsDrawer({
  open,
  onClose,
  onOpenProfile,
  onChallenge,
  myGamertag,
}: FriendsDrawerProps) {
  const [tab, setTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !settingsOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, settingsOpen, onClose]);

  const loadData = async () => {
    setLoading(true);
    const [friendsRes, reqRes] = await Promise.all([
      getFriendsListAction(),
      getFriendRequestsAction(),
    ]);
    setLoading(false);
    if (friendsRes.ok && friendsRes.data) setFriends(friendsRes.data);
    if (reqRes.ok && reqRes.data) setRequests(reqRes.data);
  };

  useEffect(() => {
    if (open) void loadData();
  }, [open]);

  if (!open || !mounted) return null;

  const handleRemoveFriend = async (gamertag: string) => {
    setFriends((prev) => prev.filter((f) => f.gamertag !== gamertag));
    await removeFriendAction(gamertag);
  };

  const handleRespondRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    await respondFriendRequestAction(requestId, action);
    void loadData();
  };

  const handleCancelRequest = async (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    await cancelFriendRequestAction(requestId);
    void loadData();
  };

  const onlineFriends = friends.filter((f) => f.presence === 'online' || f.presence === 'in_game');
  const otherFriends = friends.filter((f) => f.presence !== 'online' && f.presence !== 'in_game');

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[900]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Amici e Duellanti"
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-md">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Social & Duelli</p>
              <h2 className="text-xl font-black tracking-tight text-header-bg">Amici & Giocatori</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Impostazioni Social"
              title="Impostazioni Social e Profilo Ebartex"
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="border-b border-slate-200/80 bg-white px-7 pt-3">
          <nav className="flex space-x-3">
            <SocialTabButton
              active={tab === 'friends'}
              onClick={() => setTab('friends')}
              label="Amici"
              badge={friends.length}
            />
            <SocialTabButton
              active={tab === 'requests'}
              onClick={() => setTab('requests')}
              label="Richieste"
              badge={requests.length > 0 ? requests.length : undefined}
              badgeHighlight={requests.some((r) => r.direction === 'incoming')}
            />
            <SocialTabButton
              active={tab === 'search'}
              onClick={() => setTab('search')}
              label="Cerca"
              icon={Search}
            />
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 px-7 py-6">
          {tab === 'friends' && (
            <div className="space-y-6">
              {loading ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
                  Caricamento amici…
                </div>
              ) : friends.length === 0 ? (
                <div className="py-16 text-center">
                  <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white border border-slate-200 text-slate-400 shadow-sm">
                    <UserPlus className="h-7 w-7" />
                  </span>
                  <p className="text-base font-bold text-slate-800">Nessun amico ancora</p>
                  <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-relaxed text-slate-500">
                    Cerca i tuoi compagni di gioco o aggiungili direttamente dai tavoli e dalle partite.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('search')}
                    className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                  >
                    Cerca giocatori
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {onlineFriends.length > 0 && (
                    <div>
                      <h3 className="mb-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                        Online ({onlineFriends.length})
                      </h3>
                      <ul className="space-y-2.5">
                        {onlineFriends.map((f) => (
                          <FriendRow
                            key={f.gamertag}
                            friend={f}
                            onOpenProfile={onOpenProfile}
                            onChallenge={onChallenge}
                            onRemove={handleRemoveFriend}
                          />
                        ))}
                      </ul>
                    </div>
                  )}

                  {otherFriends.length > 0 && (
                    <div>
                      <h3 className="mb-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                        Non al tavolo ({otherFriends.length})
                      </h3>
                      <ul className="space-y-2.5">
                        {otherFriends.map((f) => (
                          <FriendRow
                            key={f.gamertag}
                            friend={f}
                            onOpenProfile={onOpenProfile}
                            onChallenge={onChallenge}
                            onRemove={handleRemoveFriend}
                          />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'requests' && (
            <FriendRequestsList
              requests={requests}
              onRespond={handleRespondRequest}
              onCancel={handleCancelRequest}
              onOpenProfile={onOpenProfile}
            />
          )}

          {tab === 'search' && <FriendSearch onOpenProfile={onOpenProfile} />}
        </div>
      </aside>

      <SocialSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        gamertag={myGamertag}
      />
    </div>,
    document.body,
  );
}
