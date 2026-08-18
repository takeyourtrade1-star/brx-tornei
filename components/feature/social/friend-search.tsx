'use client';

import { useEffect, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { searchPlayersAction, sendFriendRequestAction } from '@/actions/social';
import type { FriendSummary } from '@/types/social';
import { getAvatarById } from '@/lib/avatars';
import { Button } from '@/components/ui/button';

interface FriendSearchProps {
  onOpenProfile: (gamertag: string) => void;
}

export function FriendSearch({ onOpenProfile }: FriendSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      searchPlayersAction(trimmed).then((res) => {
        if (cancelled) return;
        setLoading(false);
        if (res.ok && res.data) setResults(res.data);
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSendRequest = async (gamertag: string) => {
    setSentMap((prev) => ({ ...prev, [gamertag]: true }));
    await sendFriendRequestAction(gamertag);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per gamertag…"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs font-bold text-slate-400 animate-pulse">
          Ricerca in corso…
        </div>
      ) : results.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {results.map((player) => {
            const avatar = getAvatarById(player.avatarId);
            const AvatarIcon = avatar.icon;
            const isSent = sentMap[player.gamertag];

            return (
              <li key={player.gamertag} className="flex items-center justify-between gap-3 p-3">
                <button
                  type="button"
                  onClick={() => onOpenProfile(player.gamertag)}
                  className="flex min-w-0 items-center gap-2.5 text-left focus-visible:outline-none"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white">
                    <AvatarIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-800">{player.gamertag}</p>
                    <p className="text-[10px] font-semibold text-slate-400">{player.statusText}</p>
                  </div>
                </button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isSent}
                  onClick={() => handleSendRequest(player.gamertag)}
                  className="h-7 gap-1 rounded-lg px-2.5 text-[10px] font-bold"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>{isSent ? 'Inviata' : 'Aggiungi'}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      ) : query.trim().length >= 2 ? (
        <div className="py-8 text-center text-xs font-bold text-slate-400">
          Nessun giocatore trovato con questo gamertag.
        </div>
      ) : (
        <div className="py-6 text-center text-xs font-medium text-slate-400">
          Digita almeno 2 caratteri per cercare altri duellanti.
        </div>
      )}
    </div>
  );
}
