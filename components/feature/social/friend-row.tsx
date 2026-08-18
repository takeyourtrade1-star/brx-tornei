'use client';

import { useState } from 'react';
import { Check, Flame, Swords, UserMinus, X } from 'lucide-react';
import type { FriendSummary } from '@/types/social';
import { getAvatarById } from '@/lib/avatars';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FriendRowProps {
  friend: FriendSummary;
  onOpenProfile: (gamertag: string) => void;
  onChallenge: (gamertag: string) => void;
  onRemove?: (gamertag: string) => void;
}

export function FriendRow({ friend, onOpenProfile, onChallenge, onRemove }: FriendRowProps) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const avatar = getAvatarById(friend.avatarId);
  const AvatarIcon = avatar.icon;

  const presenceDot = {
    online: 'bg-emerald-500 ring-emerald-400/30',
    in_game: 'bg-purple-500 ring-purple-400/30',
    recent: 'bg-amber-400 ring-amber-300/30',
    offline: 'bg-slate-300 ring-slate-200',
  }[friend.presence];

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-4">
      <button
        type="button"
        onClick={() => onOpenProfile(friend.gamertag)}
        className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none"
      >
        <div className="relative shrink-0">
          <div
            className={cn(
              'grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-b from-slate-900 via-header-bg to-black text-white shadow-sm',
              avatar.bgGradient,
            )}
          >
            <AvatarIcon className="h-6 w-6" />
          </div>
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white',
              presenceDot,
            )}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-black text-slate-900 sm:text-base">
              {friend.gamertag}
            </span>
            {friend.winStreak >= 3 && (
              <span title="On Fire 🔥" className="inline-flex shrink-0">
                <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
              </span>
            )}
          </div>
          <p className="truncate text-xs font-semibold text-slate-500">
            {friend.statusText ?? (friend.presence === 'online' ? 'Online adesso' : 'Attivo di recente')}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        {confirmingRemove ? (
          <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 p-1.5 animate-in fade-in duration-150">
            <span className="text-[11px] font-black text-red-700 pl-1">Rimuovere?</span>
            <button
              type="button"
              onClick={() => {
                setConfirmingRemove(false);
                onRemove?.(friend.gamertag);
              }}
              title="Conferma rimozione"
              className="grid h-7 w-7 place-items-center rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmingRemove(false)}
              title="Annulla"
              className="grid h-7 w-7 place-items-center rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Button
              type="button"
              onClick={() => onChallenge(friend.gamertag)}
              disabled={friend.presence === 'offline'}
              className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-3.5 text-xs font-black text-white shadow-sm hover:brightness-105 disabled:opacity-40"
            >
              <Swords className="h-4 w-4" />
              <span>Sfida</span>
            </Button>

            {onRemove && (
              <button
                type="button"
                onClick={() => setConfirmingRemove(true)}
                title="Rimuovi amico"
                aria-label={`Rimuovi ${friend.gamertag} dagli amici`}
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
              >
                <UserMinus className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
