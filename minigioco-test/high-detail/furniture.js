import { drawTournamentFurniture } from "./furniture-tournament.js";
import { drawSeatingFurniture } from "./furniture-seating.js";
import { drawArcadeFurniture } from "./furniture-arcade.js";
import { drawPiazzaFurniture } from "./furniture-social.js";
import { frameFor } from "./furniture-helpers.js";

function roomId(room) {
  if (typeof room === "string") return room.toLowerCase();
  if (!room || typeof room !== "object") return "tournament";
  const value = room.id || room.kind || room.name || "tournament";
  return String(value).toLowerCase();
}

function isCabinet(key) {
  const normalized = key.toLowerCase();
  return normalized.startsWith("cabinet") || normalized.startsWith("arcadecabinet") || normalized.startsWith("piazzacabinet") || normalized.startsWith("allroomcabinet");
}

export function drawDetailedFurniture(ctx, room, entity, time = 0) {
  if (!ctx || !entity) return null;
  void time;
  const key = String(entity.key || "");
  const id = roomId(room);
  const item = { ...frameFor(entity), key };
  if (key === "desk" || key === "tournamentdesk" || key === "table") return drawTournamentFurniture(ctx, item);
  if (["chair", "stool", "stool2", "plant", "cam", "cam2", "lamp", "turn"].includes(key)) {
    return drawSeatingFurniture(ctx, item);
  }
  if (key === "table1" || key === "table2" || key === "bench") return drawPiazzaFurniture(ctx, item);
  if (key === "kakeTable" || key === "sofa" || key === "ticket" || key === "popcorn" || isCabinet(key)) {
    return drawArcadeFurniture(ctx, item, id.includes("piazza") ? "piazza" : "arcade");
  }
  return null;
}
