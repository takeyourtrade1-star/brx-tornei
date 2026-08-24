import type { FriendSummary } from '@/types/social';
import { FriendRow } from './friend-row';
import { FriendsEmptyState } from './friends-empty-state';

interface FriendsListPanelProps {
  loading: boolean;
  friends: FriendSummary[];
  onSearch: () => void;
  onShowQr: () => void;
  onOpenProfile: (gamertag: string) => void;
  onChallenge: (gamertag: string) => void;
  onRemove: (gamertag: string) => void;
}

export function FriendsListPanel({
  loading,
  friends,
  onSearch,
  onShowQr,
  onOpenProfile,
  onChallenge,
  onRemove,
}: FriendsListPanelProps) {
  if (loading) {
    return (
      <div className="animate-pulse py-12 text-center text-xs font-bold text-white/40">
        Caricamento amici…
      </div>
    );
  }

  if (friends.length === 0) {
    return <FriendsEmptyState onSearch={onSearch} onShowQr={onShowQr} />;
  }

  const onlineFriends = friends.filter((f) => f.presence === 'online' || f.presence === 'in_game');
  const otherFriends = friends.filter((f) => f.presence !== 'online' && f.presence !== 'in_game');

  return (
    <div className="space-y-6">
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
