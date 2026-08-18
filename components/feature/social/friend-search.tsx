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
    }, 250);

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
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca qualsiasi giocatore per gamertag…"
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-10 text-sm font-bold text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
          Ricerca giocatori in corso…
        </div>
      ) : results.length > 0 ? (
        <ul className="space-y-2.5">
          {results.map((player) => {
            const avatar = getAvatarById(player.avatarId);
            const AvatarIcon = avatar.icon;
            const isSent = sentMap[player.gamertag];

            return (
              <li
                key={player.gamertag}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-4"
              >
                <button
                  type="button"
                  onClick={() => onOpenProfile(player.gamertag)}
                  className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
                    <AvatarIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-black text-slate-900">{player.gamertag}</p>
                      {player.isBot && (
                        <span className="rounded-md border border-purple-300 bg-purple-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-700 shrink-0">
                          BOT | Test
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-500">{player.statusText}</p>
                  </div>
                </button>

                <Button
                  type="button"
                  disabled={isSent}
                  onClick={() => handleSendRequest(player.gamertag)}
                  className="h-9 gap-1.5 rounded-xl px-3.5 text-xs font-bold shadow-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{isSent ? 'Inviata' : 'Aggiungi'}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      ) : query.trim().length >= 2 ? (
        <div className="py-12 text-center text-xs font-bold text-slate-400">
          Nessun giocatore trovato con questo gamertag.
        </div>
      ) : (
        <div className="py-8 text-center text-xs font-medium text-slate-400">
          Digita almeno 2 caratteri per trovare qualsiasi duellante o amico.
        </div>
      )}
    </div>
  );
}
