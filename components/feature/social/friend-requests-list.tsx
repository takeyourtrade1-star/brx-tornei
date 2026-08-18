'use client';

import { Check, UserPlus, X } from 'lucide-react';
import type { FriendRequestItem } from '@/types/social';
import { getAvatarById } from '@/lib/avatars';
import { Button } from '@/components/ui/button';

interface FriendRequestsListProps {
  requests: FriendRequestItem[];
  onRespond: (requestId: string, action: 'accept' | 'decline') => void;
  onOpenProfile: (gamertag: string) => void;
}

export function FriendRequestsList({ requests, onRespond, onOpenProfile }: FriendRequestsListProps) {
  if (requests.length === 0) {
    return (
      <div className="py-16 text-center">
        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white border border-slate-200 text-slate-400 shadow-sm">
          <UserPlus className="h-7 w-7" />
        </span>
        <p className="text-base font-bold text-slate-800">Nessuna richiesta in attesa</p>
        <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-relaxed text-slate-500">
          Quando altri giocatori ti invieranno una richiesta di amicizia, comparirà qui.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((req) => {
        const avatar = getAvatarById(req.avatarId);
        const AvatarIcon = avatar.icon;

        return (
          <li
            key={req.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
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
                <p className="truncate text-sm font-black text-slate-900">{req.gamertag}</p>
                <p className="text-xs font-semibold text-slate-400">{req.createdAtText}</p>
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
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
