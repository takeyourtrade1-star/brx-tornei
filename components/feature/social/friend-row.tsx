'use client';

import { useState } from 'react';
import { Check, Flame, Swords, UserMinus, X } from 'lucide-react';
import type { FriendSummary } from '@/types/social';
import { getAvatarById } from '@/lib/avatars';
import { presenceStatusText } from '@/lib/data/social-presence';
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

  const isDnd = friend.presence === 'dnd';
  const isOffline = friend.presence === 'offline';

  const presenceDot = {
    online: 'bg-emerald-500 ring-emerald-400/30',
    in_game: 'bg-purple-500 ring-purple-400/30',
    dnd: 'bg-amber-500 ring-amber-400/30',
    recent: 'bg-amber-400 ring-amber-300/30',
    offline: 'bg-slate-500 ring-slate-400/30',
  }[friend.presence];

  const defaultStatusText = presenceStatusText(friend.presence);

  return (
    <li className="arena-card flex items-center justify-between gap-3 p-3.5 sm:p-4">
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
              'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-[#0a0f1d]',
              presenceDot,
            )}
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-black text-white sm:text-base">
              {friend.gamertag}
            </span>
            {friend.isBot && (
              <span className="shrink-0 rounded-md border border-purple-400/30 bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-300">
                BOT | Test
              </span>
            )}
            {friend.winStreak >= 3 && (
              <span title="On Fire 🔥" className="inline-flex shrink-0">
                <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
              </span>
            )}
          </div>
          <p
            className={cn(
              'truncate text-xs font-semibold',
              isDnd ? 'text-amber-300' : 'text-white/50',
            )}
          >
            {friend.statusText ?? defaultStatusText}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        {confirmingRemove ? (
          <div className="flex animate-in fade-in items-center gap-1.5 rounded-xl border border-red-400/25 bg-red-500/10 p-1.5 duration-150">
            <span className="pl-1 text-[11px] font-black text-red-300">Rimuovere?</span>
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
              className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Button
              type="button"
              onClick={() => onChallenge(friend.gamertag)}
              disabled={isOffline || isDnd}
              title={
                isDnd
                  ? 'Questo giocatore ha impostato "Non disturbare" per il momento e non può ricevere inviti di sfida'
                  : undefined
              }
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
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 text-white/40 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
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
