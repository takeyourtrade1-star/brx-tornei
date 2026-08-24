'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, Search, UserPlus, X } from 'lucide-react';
import { searchPlayersAction, sendFriendRequestAction } from '@/actions/social';
import type { FriendSummary } from '@/types/social';
import { getAvatarById } from '@/lib/avatars';
import { Button } from '@/components/ui/button';

interface FriendSearchProps {
  onOpenProfile: (gamertag: string) => void;
  friendGamertags?: readonly string[];
  pendingGamertags?: readonly string[];
}

export function FriendSearch({
  onOpenProfile,
  friendGamertags = [],
  pendingGamertags = [],
}: FriendSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      searchPlayersAction(trimmed)
        .then((res) => {
          if (cancelled) return;
          setLoading(false);
          if (res.ok && res.data) {
            setResults(res.data);
            setErrorMsg(null);
          } else {
            setResults([]);
            setErrorMsg(res.error ?? 'Impossibile cercare i giocatori.');
          }
        })
        .catch(() => {
          if (cancelled) return;
          setLoading(false);
          setResults([]);
          setErrorMsg('Impossibile cercare i giocatori.');
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSendRequest = async (gamertag: string) => {
    setErrorMsg(null);
    const res = await sendFriendRequestAction(gamertag);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Impossibile inviare la richiesta.');
      return;
    }
    setSentMap((prev) => ({ ...prev, [gamertag]: true }));
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setErrorMsg(null);
          }}
          placeholder="Cerca qualsiasi giocatore per gamertag…"
          className="h-12 w-full rounded-2xl border border-white/15 bg-white/5 pl-11 pr-10 text-sm font-bold text-white placeholder:text-white/35 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setErrorMsg(null);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="flex animate-in fade-in items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-xs font-bold text-red-300 duration-150">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse py-12 text-center text-xs font-bold text-white/40">
          Ricerca giocatori in corso…
        </div>
      ) : results.length > 0 ? (
        <ul className="space-y-2.5">
          {results.map((player) => {
            const avatar = getAvatarById(player.avatarId);
            const AvatarIcon = avatar.icon;
            const normalized = player.gamertag.toLowerCase();
            const isFriend = friendGamertags.some((tag) => tag.toLowerCase() === normalized);
            const isPending = Boolean(
              sentMap[player.gamertag] ||
              pendingGamertags.some((tag) => tag.toLowerCase() === normalized),
            );

            return (
              <li
                key={player.gamertag}
                className="arena-card flex items-center justify-between gap-3 p-3.5 sm:p-4"
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
                      <p className="truncate text-sm font-black text-white">{player.gamertag}</p>
                      {player.isBot && (
                        <span className="shrink-0 rounded-md border border-purple-400/30 bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-300">
                          BOT | Test
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white/50">{player.statusText}</p>
                  </div>
                </button>

                <Button
                  type="button"
                  disabled={isFriend || isPending}
                  onClick={() => handleSendRequest(player.gamertag)}
                  className="h-9 gap-1.5 rounded-xl px-3.5 text-xs font-bold shadow-sm"
                >
                  {isFriend ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  <span>{isFriend ? 'Amico' : isPending ? 'In attesa' : 'Aggiungi'}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      ) : query.trim().length >= 2 ? (
        <div className="py-12 text-center text-xs font-bold text-white/40">
          Nessun giocatore trovato con questo gamertag.
        </div>
      ) : (
        <div className="py-8 text-center text-xs font-medium text-white/40">
          Digita almeno 2 caratteri per trovare qualsiasi duellante o amico.
        </div>
      )}
    </div>
  );
}
