import React from "react";
import type { SocialRoomPlayer } from "./social-room-protocol";

export const QUICK_MESSAGES = ["Ciao!", "Buona partita!", "Ti va un duello?"] as const;

function avatarMark(avatarId: string): string {
  const parts = avatarId.split(":").filter(Boolean);
  const label = parts[parts.length - 1] ?? avatarId;
  return Array.from(label).slice(0, 2).join("").toUpperCase() || "◎";
}

export function PlayerRow({ player }: { readonly player: SocialRoomPlayer }): React.JSX.Element {
  const statusLabel = player.isSelf ? "Tu" : "Presente";
  return (
    <li
      className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2"
      aria-label={`${player.gamertag}, ${statusLabel.toLowerCase()}`}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-gradient-card3 font-display text-[11px] font-black uppercase tracking-wide text-white shadow-sm"
        aria-hidden="true"
      >
        {avatarMark(player.avatarId)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-black text-white">{player.gamertag}</span>
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
            {statusLabel}
          </span>
        </span>
      </span>
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" aria-hidden="true" />
    </li>
  );
}

export function ChatBubble({ player }: { readonly player: SocialRoomPlayer }): React.JSX.Element | null {
  if (!player.bubble) return null;
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
      <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-[11px] font-black text-white">
          {player.isSelf ? `Tu · ${player.gamertag}` : player.gamertag}
        </span>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-5 text-white/90">
        {player.bubble.text}
      </p>
    </li>
  );
}
