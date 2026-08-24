'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { sendFriendRequestAction } from '@/actions/social';
import { getAvatarById } from '@/lib/avatars';
import type { RecentOpponent } from '@/types/social';
import { cn } from '@/lib/utils';

const OUTCOME_META: Record<RecentOpponent['lastOutcome'], { label: string; className: string }> = {
  win: { label: 'Vittoria', className: 'text-emerald-300' },
  loss: { label: 'Sconfitta', className: 'text-rose-300' },
  abandoned: { label: 'Abbandonata', className: 'text-amber-300' },
  disputed: { label: 'Contestata', className: 'text-white/50' },
};

interface RecentOpponentsListProps {
  opponents: RecentOpponent[];
  friendGamertags: readonly string[];
  pendingGamertags: readonly string[];
  onOpenProfile: (gamertag: string) => void;
  onAdded?: () => void;
}

export function RecentOpponentsList({
  opponents,
  friendGamertags,
  pendingGamertags,
  onOpenProfile,
  onAdded,
}: RecentOpponentsListProps) {
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const friendSet = new Set(friendGamertags.map((tag) => tag.toLowerCase()));
  const visible = opponents.filter((opponent) => !friendSet.has(opponent.gamertag.toLowerCase()));

  if (visible.length === 0) return null;

  const isPending = (gamertag: string) =>
    sent[gamertag] || pendingGamertags.some((tag) => tag.toLowerCase() === gamertag.toLowerCase());

  const handleQuickAdd = async (gamertag: string) => {
    setError(null);
    setBusy(gamertag);
    const result = await sendFriendRequestAction(gamertag);
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? 'Impossibile inviare la richiesta.');
      return;
    }
    setSent((prev) => ({ ...prev, [gamertag]: true }));
    onAdded?.();
  };

  return (
    <section>
      <h3 className="mb-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
        Giocato di recente
      </h3>
      {error && (
        <p className="mb-2.5 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-300">
          {error}
        </p>
      )}
      <ul className="space-y-2.5">
        {visible.map((opponent) => {
          const avatar = getAvatarById();
          const AvatarIcon = avatar.icon;
          const outcome = OUTCOME_META[opponent.lastOutcome];
          const pending = isPending(opponent.gamertag);
          const matchesLabel =
            opponent.matches > 1 ? `${opponent.matches} partite` : '1 partita';

          return (
            <li key={opponent.gamertag} className="arena-card flex items-center justify-between gap-3 p-3.5">
              <button
                type="button"
                onClick={() => onOpenProfile(opponent.gamertag)}
                className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
                  <AvatarIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-white">{opponent.gamertag}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-semibold text-white/50">
                    <span className={cn('font-bold', outcome.className)}>{outcome.label}</span>
                    {' · '}
                    {matchesLabel}
                    {' · '}
                    {opponent.lastPlayedText}
                  </span>
                </span>
              </button>

              <button
                type="button"
                disabled={pending || busy === opponent.gamertag}
                onClick={() => void handleQuickAdd(opponent.gamertag)}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[11px] font-black uppercase tracking-wide transition',
                  pending
                    ? 'border border-white/15 bg-white/5 text-white/50'
                    : 'bg-gradient-to-r from-[#FF7300] to-[#e0564d] text-white shadow-sm hover:brightness-105',
                )}
              >
                {pending ? (
                  'In attesa'
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    Aggiunta rapida
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
