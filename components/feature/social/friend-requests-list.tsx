'use client';

import { useState } from 'react';
import { Check, Clock, Inbox, Send, UserPlus, X } from 'lucide-react';
import type { FriendRequestItem } from '@/types/social';
import { getAvatarById } from '@/lib/avatars';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FriendRequestsListProps {
  requests: FriendRequestItem[];
  onRespond: (requestId: string, action: 'accept' | 'decline') => void;
  onCancel?: (requestId: string) => void;
  onOpenProfile: (gamertag: string) => void;
}

export function FriendRequestsList({
  requests,
  onRespond,
  onCancel,
  onOpenProfile,
}: FriendRequestsListProps) {
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');

  const incoming = requests.filter((r) => r.direction === 'incoming');
  const outgoing = requests.filter((r) => r.direction === 'outgoing');

  if (requests.length === 0) {
    return (
      <div className="py-16 text-center">
        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/5 text-white/40">
          <UserPlus className="h-7 w-7" />
        </span>
        <p className="font-display text-base font-bold text-white">Nessuna richiesta pendente</p>
        <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-relaxed text-white/50">
          Non hai richieste di amicizia in attesa, né ricevute né inviate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sub-filtri per vedere Ricevute ed Inviate */}
      <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'flex-1 rounded-lg py-1.5 text-xs font-black transition',
            filter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'text-white/50 hover:text-white',
          )}
        >
          Tutte ({requests.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('incoming')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-black transition',
            filter === 'incoming'
              ? 'bg-primary text-white shadow-sm'
              : 'text-white/50 hover:text-white',
          )}
        >
          <Inbox className="h-3.5 w-3.5" />
          <span>Ricevute ({incoming.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter('outgoing')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-black transition',
            filter === 'outgoing'
              ? 'bg-primary text-white shadow-sm'
              : 'text-white/50 hover:text-white',
          )}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Inviate ({outgoing.length})</span>
        </button>
      </div>

      {/* Sezione Richieste Ricevute */}
      {(filter === 'all' || filter === 'incoming') && incoming.length > 0 && (
        <div>
          <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-300">
            <Inbox className="h-3.5 w-3.5" />
            <span>Richieste Ricevute ({incoming.length})</span>
          </h3>
          <ul className="space-y-2.5">
            {incoming.map((req) => {
              const avatar = getAvatarById(req.avatarId);
              const AvatarIcon = avatar.icon;

              return (
                <li
                  key={req.id}
                  className="arena-card flex items-center justify-between gap-3 p-3.5 sm:p-4"
                >
                  <button
                    type="button"
                    onClick={() => onOpenProfile(req.gamertag)}
                    className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
                      <AvatarIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-black text-white">{req.gamertag}</p>
                        {req.isBot && (
                          <span className="shrink-0 rounded-md border border-purple-400/30 bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-300">
                            BOT | Test
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-white/40">{req.createdAtText}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      onClick={() => onRespond(req.id, 'accept')}
                      className="h-9 gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                    >
                      <Check className="h-4 w-4" />
                      <span>Accetta</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => onRespond(req.id, 'decline')}
                      aria-label="Rifiuta richiesta"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 text-white/40 transition hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Sezione Richieste Inviate */}
      {(filter === 'all' || filter === 'outgoing') && outgoing.length > 0 && (
        <div>
          <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/45">
            <Send className="h-3.5 w-3.5" />
            <span>Richieste Inviate da te ({outgoing.length})</span>
          </h3>
          <ul className="space-y-2.5">
            {outgoing.map((req) => {
              const avatar = getAvatarById(req.avatarId);
              const AvatarIcon = avatar.icon;

              return (
                <li
                  key={req.id}
                  className="arena-card flex items-center justify-between gap-3 p-3.5 sm:p-4"
                >
                  <button
                    type="button"
                    onClick={() => onOpenProfile(req.gamertag)}
                    className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
                      <AvatarIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-black text-white">{req.gamertag}</p>
                        {req.isBot && (
                          <span className="shrink-0 rounded-md border border-purple-400/30 bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-300">
                            BOT | Test
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                        <Clock className="h-3.5 w-3.5" />
                        <span>In attesa di risposta ({req.createdAtText})</span>
                      </div>
                    </div>
                  </button>

                  {onCancel && (
                    <button
                      type="button"
                      onClick={() => onCancel(req.id)}
                      className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-white/15 px-3 text-xs font-bold text-white/50 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Annulla</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
