"use client";

import React from "react";
import IsoRoomGame from "../IsoRoomGame";
import type { SocialRoomFriendPresence } from "@/types/social";
import type { SocialRoomFriendInput } from "./social-room-protocol";

export interface SocialRoomProps {
  readonly roomId?: string;
  readonly gamertag?: string;
  readonly avatarId?: string;
  readonly initialFriends?: readonly SocialRoomFriendInput[];
  readonly enabled?: boolean;
  readonly onExit?: () => void;
}

/**
 * Wrapper client per Sala Piazza:
 * Monta direttamente il motore grafico isometrico principale IsoRoomGame
 * avviandolo nella stanza 'piazza', condividendo lo stesso avatar, la stessa
 * telecamera, le finestre panoramiche, i 3 cabinati arcade e i tavoli da duello TCG.
 */
export function SocialRoom({
  gamertag = "PrincessLeo",
  initialFriends = [],
  onExit,
}: SocialRoomProps): React.JSX.Element {
  const friends = (initialFriends || []) as unknown as SocialRoomFriendPresence[];

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <IsoRoomGame
        initialRoom="piazza"
        roomName="Sala Piazza"
        username={gamertag}
        initialFriends={friends}
        onExitToSimple={onExit}
      />
    </div>
  );
}
