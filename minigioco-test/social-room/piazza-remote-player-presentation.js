/** Presentazione canvas dei remoti: preferenze, nameplate e bolle chat. */
import {
  CHAT_BUBBLE_DURATION_MS,
  MAX_CHAT_LENGTH,
  SOCIAL_ROOM_BOUNDS,
  normalizeGamertag,
} from "./social-room-protocol";
const BUBBLE_TEXT_WIDTH = 176;
const BUBBLE_MAX_LINES = 4;
const NAMEPLATE_TEXT_WIDTH = 148;
const DARK_PALETTE = Object.freeze({
  shadow: "rgba(25,22,40,0.3)", plate: "rgba(16,22,38,0.92)",
  plateOutline: "rgba(255,255,255,0.3)", text: "#ffffff", bubble: "#ffffff",
  outline: "#1a1f36", dot: "#52b788",
});
const LIGHT_PALETTE = Object.freeze({
  shadow: "rgba(37,43,59,0.2)", plate: "rgba(255,255,255,0.94)",
  plateOutline: "rgba(32,46,68,0.48)", text: "#142033", bubble: "#fffdf5",
  outline: "#27344d", dot: "#198754",
});
function safeNowMs(value) {
  if (Number.isSafeInteger(value) && value >= 0) return value;
  const now = Date.now();
  return Number.isSafeInteger(now) && now >= 0 ? now : 0;
}
function mediaPreference(query) {
  try {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia(query).matches;
    }
  } catch {
    // Le preferenze del browser non devono interrompere il render.
  }
  return false;
}
function tabIsInactive() {
  try {
    return typeof document !== "undefined" && document.hidden === true;
  } catch {
    return false;
  }
}
/** Opzioni facoltative: il consumer attuale può ometterle e usare le media query. */
export function getRemotePlayerRenderOptions(overrides = {}) {
  const input = overrides && typeof overrides === "object" ? overrides : {};
  return {
    reducedMotion: typeof input.reducedMotion === "boolean"
      ? input.reducedMotion : mediaPreference("(prefers-reduced-motion: reduce)"),
    lightMode: typeof input.lightMode === "boolean"
      ? input.lightMode : mediaPreference("(prefers-color-scheme: light)"),
    inactive: input.inactive === true || tabIsInactive(),
    nowMs: safeNowMs(input.nowMs),
  };
}
function cleanBubbleText(value) {
  if (typeof value !== "string") return "";
  return Array.from(value.normalize("NFKC")
    .replace(/\r\n?/gu, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/gu, " ")
    .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/gu, "")
    .replace(/[<>]/gu, ""))
    .slice(0, MAX_CHAT_LENGTH).join("").trim();
}
export function normalizeRemoteBubble(value, nowMs = safeNowMs()) {
  if (!value || typeof value !== "object") return null;
  const text = cleanBubbleText(value.text);
  const expiresAt = value.expiresAt;
  const currentTime = safeNowMs(nowMs);
  if (!text || !Number.isSafeInteger(expiresAt) || expiresAt <= currentTime) return null;
  return {
    id: typeof value.id === "string" ? value.id : "remote-bubble",
    text,
    // Un timestamp anomalo non può tenere una bolla viva indefinitamente.
    expiresAt: Math.min(expiresAt, currentTime + CHAT_BUBBLE_DURATION_MS),
  };
}
export function isRemotePlayerMoving(rp) {
  return !!(rp && (rp.nextStep || (Array.isArray(rp.queue) && rp.queue.length)
    || (Number.isFinite(rp.wt) && rp.wt > 0)));
}
function measureText(ctx, value) {
  try {
    const width = ctx.measureText(value).width; return Number.isFinite(width) ? width : Array.from(value).length * 6;
  } catch {
    return Array.from(value).length * 6;
  }
}
function fitText(ctx, value, maxWidth) {
  const chars = Array.from(value);
  if (measureText(ctx, value) <= maxWidth) return value;
  let end = chars.length;
  while (end > 0 && measureText(ctx, chars.slice(0, end).join("") + "…") > maxWidth) end -= 1;
  return chars.slice(0, end).join("") + "…";
}
function appendEllipsis(ctx, value, maxWidth) {
  const chars = Array.from(value);
  let end = chars.length;
  while (end > 0 && measureText(ctx, chars.slice(0, end).join("") + "…") > maxWidth) end -= 1;
  return chars.slice(0, end).join("") + "…";
}
function wrapLine(ctx, value, maxWidth) {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let line = "";
  for (const word of words) {
    if (measureText(ctx, word) > maxWidth) {
      if (line) lines.push(line);
      line = "";
      for (const char of Array.from(word)) {
        if (line && measureText(ctx, line + char) > maxWidth) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
      continue;
    }
    const candidate = line ? line + " " + word : word;
    if (line && measureText(ctx, candidate) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}
/** Divide il testo già limitato dal protocollo in righe leggibili per il canvas. */
export function formatRemoteChatLines(ctx, value, maxWidth = BUBBLE_TEXT_WIDTH, maxLines = BUBBLE_MAX_LINES) {
  const width = Number.isFinite(maxWidth) && maxWidth > 20 ? maxWidth : BUBBLE_TEXT_WIDTH;
  const count = Number.isSafeInteger(maxLines) && maxLines > 0 ? maxLines : BUBBLE_MAX_LINES;
  const text = cleanBubbleText(value);
  if (!text) return [];
  const lines = text.split("\n").flatMap((line) => wrapLine(ctx, line, width));
  if (lines.length <= count) return lines;
  const visible = lines.slice(0, count);
  visible[count - 1] = appendEllipsis(ctx, visible[count - 1], width);
  return visible;
}
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, width, height, radius);
  else ctx.rect(x, y, width, height);
}
function drawChatBubble(ctx, x, y, text, palette) {
  ctx.font = "10px 'Segoe UI', system-ui, sans-serif";
  const lines = formatRemoteChatLines(ctx, text);
  if (!lines.length) return;
  const lineHeight = 13;
  const bubbleWidth = Math.min(BUBBLE_TEXT_WIDTH + 18, Math.max(...lines.map((line) => measureText(ctx, line))) + 18);
  const bubbleHeight = lines.length * lineHeight + 12;
  const bx = Math.round(x - bubbleWidth / 2);
  const by = Math.round(y - bubbleHeight);
  ctx.fillStyle = palette.bubble;
  roundedRect(ctx, bx, by, bubbleWidth, bubbleHeight, 6);
  ctx.fill();
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  const tailX = Math.max(bx + 9, Math.min(bx + bubbleWidth - 9, x));
  ctx.beginPath();
  ctx.moveTo(tailX - 4, by + bubbleHeight);
  ctx.lineTo(tailX, by + bubbleHeight + 5);
  ctx.lineTo(tailX + 4, by + bubbleHeight);
  ctx.closePath();
  ctx.fillStyle = palette.bubble;
  ctx.fill();
  ctx.fillStyle = palette.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, index) => ctx.fillText(line, bx + bubbleWidth / 2, by + 6 + lineHeight * (index + 0.5)));
}
export function drawRemotePlayer(wctx, rp, tileTop, HTH, tNow, options = {}) {
  if (!wctx || !rp || typeof tileTop !== "function") return;
  const settings = getRemotePlayerRenderOptions(options);
  const rawFx = Number(rp.fx);
  const rawFy = Number(rp.fy);
  if (!Number.isFinite(rawFx) || !Number.isFinite(rawFy)) return;
  const fx = Math.min(SOCIAL_ROOM_BOUNDS.maxX, Math.max(SOCIAL_ROOM_BOUNDS.minX, rawFx));
  const fy = Math.min(SOCIAL_ROOM_BOUNDS.maxY, Math.max(SOCIAL_ROOM_BOUNDS.minY, rawFy));
  const c = tileTop(fx, fy);
  if (!c || !Number.isFinite(c.x) || !Number.isFinite(c.y)) return;
  const halfTileH = Number.isFinite(HTH) ? HTH : 16;
  const cxp = c.x;
  const cyp = c.y + halfTileH;
  const palette = settings.lightMode ? LIGHT_PALETTE : DARK_PALETTE;
  wctx.fillStyle = palette.shadow;
  wctx.beginPath();
  wctx.ellipse(cxp, cyp + 5, 12, 5, 0, 0, Math.PI * 2);
  wctx.fill();
  const direction = ["se", "sw", "ne", "nw"].includes(rp.dir) ? rp.dir : "se";
  const directionData = rp.avatar && (rp.avatar[direction] || rp.avatar.se);
  const idle = directionData && Array.isArray(directionData.idle) ? directionData.idle : [];
  const walk = directionData && Array.isArray(directionData.walk) ? directionData.walk : [];
  const moving = isRemotePlayerMoving(rp);
  const clock = Number.isFinite(tNow) && tNow >= 0 ? tNow : 0;
  const frames = moving && walk.length ? walk : idle;
  const phase = Number.isFinite(rp.wt) && rp.wt >= 0 ? rp.wt : 0;
  const frameIndex = settings.reducedMotion || settings.inactive ? 0 : Math.floor(moving ? phase : clock * 1.3);
  const sprite = frames.length ? frames[Math.abs(frameIndex) % frames.length] : null;
  const feetX = sprite && Number.isFinite(sprite.feet && sprite.feet.x) ? sprite.feet.x : 15.5;
  const feetY = sprite && Number.isFinite(sprite.feet && sprite.feet.y) ? sprite.feet.y : 54;
  const bob = moving && !settings.reducedMotion && !settings.inactive
    ? -Math.abs(Math.sin((Number.isFinite(rp.wt) ? rp.wt : 0) * 1.2)) * 1.4 : 0;
  const drawY = Math.round(cyp + 6 - feetY + bob);
  if (sprite && sprite.cv) wctx.drawImage(sprite.cv, Math.round(cxp - feetX), drawY);
  drawRemotePlayerAnnotations(wctx, rp, cxp, drawY, options);
}
export function drawRemotePlayerAnnotations(wctx, rp, cxp, drawY, options = {}) {
  const settings = getRemotePlayerRenderOptions(options);
  const palette = settings.lightMode ? LIGHT_PALETTE : DARK_PALETTE;
  wctx.save();
  wctx.font = "bold 9px 'Segoe UI', system-ui, sans-serif";
  const label = fitText(wctx, normalizeGamertag(rp.gamertag), NAMEPLATE_TEXT_WIDTH);
  const plateWidth = measureText(wctx, label) + 24;
  const plateHeight = 16;
  const plateX = Math.round(cxp - plateWidth / 2);
  const plateY = drawY - 19;
  wctx.fillStyle = palette.plate;
  roundedRect(wctx, plateX, plateY, plateWidth, plateHeight, 5);
  wctx.fill();
  wctx.strokeStyle = palette.plateOutline;
  wctx.lineWidth = 1;
  wctx.stroke();
  wctx.fillStyle = palette.dot;
  wctx.beginPath();
  wctx.arc(plateX + 8, plateY + 8, 3, 0, Math.PI * 2);
  wctx.fill();
  wctx.fillStyle = palette.text;
  wctx.textAlign = "left";
  wctx.textBaseline = "middle";
  wctx.fillText(label, plateX + 14, plateY + 8);
  const bubble = normalizeRemoteBubble(rp.bubble, settings.nowMs);
  if (bubble) drawChatBubble(wctx, cxp, plateY - 7, bubble.text, palette);
  wctx.restore();
}