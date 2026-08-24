import type { FriendRequestItem, FriendSummary, RecentOpponent } from '@/types/social';
import { FriendRow } from './friend-row';
import { FriendsEmptyState } from './friends-empty-state';
import { RecentOpponentsList } from './recent-opponents-list';

interface FriendsListPanelProps {
  loading: boolean;
  friends: FriendSummary[];
  requests: FriendRequestItem[];
  recentOpponents: RecentOpponent[];
  onSearch: () => void;
  onShowQr: () => void;
  onOpenProfile: (gamertag: string) => void;
  onChallenge: (gamertag: string) => void;
  onRemove: (gamertag: string) => void;
  onRecentAdded?: () => void;
}

export function FriendsListPanel({
  loading,
  friends,
  requests,
  recentOpponents,
  onSearch,
  onShowQr,
  onOpenProfile,
  onChallenge,
  onRemove,
  onRecentAdded,
}: FriendsListPanelProps) {
  if (loading) {
    return (
      <div className="animate-pulse py-12 text-center text-xs font-bold text-white/40">
        Caricamento amici…
      </div>
    );
  }

  const onlineFriends = friends.filter((f) => f.presence === 'online' || f.presence === 'in_game');
  const otherFriends = friends.filter((f) => f.presence !== 'online' && f.presence !== 'in_game');
  const pendingGamertags = requests.map((request) => request.gamertag);

  return (
    <div className="space-y-6">
      <RecentOpponentsList
        opponents={recentOpponents}
        friendGamertags={friends.map((friend) => friend.gamertag)}
        pendingGamertags={pendingGamertags}
        onOpenProfile={onOpenProfile}
        onAdded={onRecentAdded}
      />

      {friends.length === 0 && recentOpponents.length === 0 && (
        <FriendsEmptyState onSearch={onSearch} onShowQr={onShowQr} />
      )}

      {onlineFriends.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-300">
            Online ({onlineFriends.length})
          </h3>
          <ul className="space-y-2.5">
            {onlineFriends.map((friend) => (
              <FriendRow
                key={friend.gamertag}
                friend={friend}
                onOpenProfile={onOpenProfile}
                onChallenge={onChallenge}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </section>
      )}

      {otherFriends.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/45">
            Non al tavolo ({otherFriends.length})
          </h3>
          <ul className="space-y-2.5">
            {otherFriends.map((friend) => (
              <FriendRow
                key={friend.gamertag}
                friend={friend}
                onOpenProfile={onOpenProfile}
                onChallenge={onChallenge}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
