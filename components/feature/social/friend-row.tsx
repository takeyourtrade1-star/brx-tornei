'use client';

import { Flame, Swords, UserMinus } from 'lucide-react';
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
  const avatar = getAvatarById(friend.avatarId);
  const AvatarIcon = avatar.icon;

  const presenceDot = {
    online: 'bg-emerald-500 ring-emerald-400/30',
    in_game: 'bg-purple-500 ring-purple-400/30',
    recent: 'bg-amber-400 ring-amber-300/30',
    offline: 'bg-slate-300 ring-slate-200',
  }[friend.presence];

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-900/[0.06] bg-slate-50/70 p-3 transition hover:border-slate-300 hover:bg-white">
      <button
        type="button"
        onClick={() => onOpenProfile(friend.gamertag)}
        className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none"
      >
        <div className="relative shrink-0">
          <div className={cn('grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-b from-slate-900 via-header-bg to-black text-white shadow-sm', avatar.bgGradient)}>
            <AvatarIcon className="h-5 w-5" />
          </div>
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white',
              presenceDot,
            )}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-black text-slate-800 sm:text-sm">
              {friend.gamertag}
            </span>
            {friend.winStreak >= 3 && (
              <span title="On Fire 🔥" className="inline-flex shrink-0">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
              </span>
            )}
          </div>
          <p className="truncate text-[10px] font-semibold text-slate-400">
            {friend.statusText ?? (friend.presence === 'online' ? 'Online' : 'Attivo di recente')}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          onClick={() => onChallenge(friend.gamertag)}
          disabled={friend.presence === 'offline'}
          className="h-8 gap-1 rounded-lg bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-2.5 text-[11px] font-black text-white shadow-sm hover:brightness-105 disabled:opacity-40"
        >
          <Swords className="h-3.5 w-3.5" />
          <span>Sfida</span>
        </Button>

        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(friend.gamertag)}
            title="Rimuovi amico"
            aria-label={`Rimuovi ${friend.gamertag} dagli amici`}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
          >
            <UserMinus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}
