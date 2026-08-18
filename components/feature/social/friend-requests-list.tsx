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
      <div className="py-10 text-center">
        <span className="mx-auto mb-2.5 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-400">
          <UserPlus className="h-5 w-5" />
        </span>
        <p className="text-xs font-bold text-slate-700">Nessuna richiesta in attesa</p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
          Quando altri giocatori ti invieranno una richiesta di amicizia, comparirà qui.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {requests.map((req) => {
        const avatar = getAvatarById(req.avatarId);
        const AvatarIcon = avatar.icon;

        return (
          <li key={req.id} className="flex items-center justify-between gap-3 p-3.5">
            <button
              type="button"
              onClick={() => onOpenProfile(req.gamertag)}
              className="flex min-w-0 items-center gap-2.5 text-left focus-visible:outline-none"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white">
                <AvatarIcon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-slate-800">{req.gamertag}</p>
                <p className="text-[10px] font-semibold text-slate-400">{req.createdAtText}</p>
              </div>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                onClick={() => onRespond(req.id, 'accept')}
                className="h-8 gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-bold text-white hover:bg-emerald-700"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Accetta</span>
              </Button>
              <button
                type="button"
                onClick={() => onRespond(req.id, 'decline')}
                aria-label="Rifiuta richiesta"
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
