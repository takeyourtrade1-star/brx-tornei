'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, UserPlus, Users, X } from 'lucide-react';
import {
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

interface FriendsDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenProfile: (gamertag: string) => void;
  onChallenge: (gamertag: string) => void;
}

type TabType = 'friends' | 'requests' | 'search';

export function FriendsDrawer({ open, onClose, onOpenProfile, onChallenge }: FriendsDrawerProps) {
  const [tab, setTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

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

  const onlineFriends = friends.filter((f) => f.presence === 'online' || f.presence === 'in_game');
  const otherFriends = friends.filter((f) => f.presence !== 'online' && f.presence !== 'in_game');

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[900]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Amici e Duellanti"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-900/[0.06] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Users className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Social</p>
              <h2 className="text-lg font-black text-header-bg">Amici & Duellanti</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="border-b border-slate-900/[0.06] px-6 pt-3">
          <nav className="flex space-x-2">
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
              badgeHighlight={requests.length > 0}
            />
            <SocialTabButton
              active={tab === 'search'}
              onClick={() => setTab('search')}
              label="Cerca"
              icon={Search}
            />
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {tab === 'friends' && (
            <div className="space-y-4">
              {loading ? (
                <div className="py-8 text-center text-xs font-bold text-slate-400 animate-pulse">
                  Caricamento amici…
                </div>
              ) : friends.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                    <UserPlus className="h-6 w-6" />
                  </span>
                  <p className="text-sm font-bold text-slate-800">Nessun amico ancora</p>
                  <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-relaxed text-slate-400">
                    Cerca i tuoi compagni di gioco o aggiungili direttamente dai tavoli e dalle partite.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('search')}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    Cerca giocatori
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {onlineFriends.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">
                        Online ({onlineFriends.length})
                      </h3>
                      <ul className="space-y-2">
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
                      <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Non al tavolo ({otherFriends.length})
                      </h3>
                      <ul className="space-y-2">
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
              onOpenProfile={onOpenProfile}
            />
          )}

          {tab === 'search' && <FriendSearch onOpenProfile={onOpenProfile} />}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
