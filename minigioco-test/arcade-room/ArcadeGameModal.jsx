import React from "react";
import { SHELL_CSS } from "./game-kit";
import { REGISTRY } from "./arcade-registry";
import { getCspNonce } from "../csp-nonce";

/* ============================================================================
   ArcadeGameModal — wrapper che monta un minigioco della Sala Arcade dentro
   la modale di IsoRoomGame. Inietta il CSS del telaio (.ag-*), passa onExit e
   username. I giochi gestiscono autonomamente ESC, back button e game-over.
   ========================================================================== */

export default function ArcadeGameModal({ gameId, onExit, username = "", integrationMode = "prototype" }) {
  const Game = REGISTRY[gameId];
  if (!Game) return null;
  return (
    <>
      <style nonce={getCspNonce()}>{SHELL_CSS}</style>
      <Game onExit={onExit} username={username} integrationMode={integrationMode} />
    </>
  );
}
