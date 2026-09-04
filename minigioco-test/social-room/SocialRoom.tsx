"use client";

import React from "react";
import IsoRoomGame from "../IsoRoomGame";
import type { AssoWorldLook } from "@/types/asso-world";

export interface SocialRoomProps {
  readonly roomId?: string;
  readonly gamertag?: string;
  readonly avatarId?: string;
  readonly initialLook?: AssoWorldLook;
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
  initialLook,
  onExit,
}: SocialRoomProps): React.JSX.Element {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <IsoRoomGame
        initialRoom="piazza"
        roomName="Sala Piazza"
        username={gamertag}
        initialLook={initialLook}
        onExitToSimple={onExit}
      />
    </div>
  );
}
