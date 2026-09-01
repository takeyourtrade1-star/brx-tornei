/* ============================================================================
   arcade-registry — mappa gli id degli interattivi della Sala Arcade ai
   componenti giocabili. Centralizzato qui per evitare import circolari tra
   IsoRoomGame e i giochi.
   ========================================================================== */

import { lazy } from "react";

const StackAttackGame = lazy(() => import("./StackAttackGame"));
const CardMemoryGame = lazy(() => import("./CardMemoryGame"));
const TcgJumpGame = lazy(() => import("./TcgJumpGame"));
const KakeguruiGame = lazy(() => import("./KakeguruiGame"));

export const REGISTRY = {
  arcade1: StackAttackGame,
  arcade2: TcgJumpGame,
  arcade3: CardMemoryGame,
  kakegurui: KakeguruiGame,
};
