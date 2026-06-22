/* ============================================================================
   arcade-registry — mappa gli id degli interattivi della Sala Arcade ai
   componenti giocabili. Centralizzato qui per evitare import circolari tra
   IsoRoomGame e i giochi.
   ========================================================================== */

import StackAttackGame from "./StackAttackGame";
import CardMemoryGame from "./CardMemoryGame";
import TcgJumpGame from "./TcgJumpGame";
import KakeguruiGame from "./KakeguruiGame";

export const REGISTRY = {
  arcade1: StackAttackGame,
  arcade2: TcgJumpGame,
  arcade3: CardMemoryGame,
  kakegurui: KakeguruiGame,
};
