/**
 * Gestione e rendering dei giocatori remoti (amici) in Sala Piazza.
 * Sincronizzati dal WebSocket autenticato della Piazza.
 */

const HAIRS = ["m1", "m2", "m3", "f1", "f2", "f3"];
const OUTFITS = ["tank", "hoodie", "jacket", "shirt", "jersey"];
const DEFAULT_LOOK = Object.freeze({ hair: "m3", outfit: "tank" });

export function parseFriendLook(avatarId) {
  if (typeof avatarId === "string" && avatarId.startsWith("look:")) {
    const parts = avatarId.split(":");
    if (parts.length === 3 && HAIRS.includes(parts[1]) && OUTFITS.includes(parts[2])) {
      return { hair: parts[1], outfit: parts[2] };
    }
  }
  return { ...DEFAULT_LOOK };
}

export function syncRemotePlayers(remoteMap, playerList, buildAvatar) {
  const activeIds = new Set();
  for (const p of playerList || []) {
    if (p.isSelf) continue;
    activeIds.add(p.peerId);
    let rp = remoteMap.get(p.peerId);
    const lookKey = p.avatarId || "default";

    if (!rp) {
      const look = parseFriendLook(p.avatarId);
      const px = Number.isFinite(p.position?.x) ? p.position.x : 9;
      const py = Number.isFinite(p.position?.y) ? p.position.y : 3;
      rp = {
        peerId: p.peerId,
        gamertag: p.gamertag || "Giocatore",
        lookKey,
        avatar: buildAvatar(look),
        fx: px,
        fy: py,
        tx: px,
        ty: py,
        dir: "se",
        wt: 0,
        queue: [],
        nextStep: null,
        lastMovementSequence: Math.max(0, ...(p.movementTrail || []).map((step) => step.sequence)),
        bubble: p.bubble || null,
      };
      remoteMap.set(p.peerId, rp);
    } else {
      rp.gamertag = p.gamertag || "Giocatore";
      if (rp.lookKey !== lookKey) {
        rp.lookKey = lookKey;
        rp.avatar = buildAvatar(parseFriendLook(p.avatarId));
      }
      const unseenSteps = (p.movementTrail || []).filter(
        (step) => step.sequence > (rp.lastMovementSequence || 0),
      );
      for (const step of unseenSteps) {
        const target = { cx: Math.round(step.position.x), cy: Math.round(step.position.y) };
        const queued = rp.queue[rp.queue.length - 1] || rp.nextStep;
        const origin = queued || { cx: rp.tx, cy: rp.ty };
        const contiguous = Math.abs(origin.cx - target.cx) + Math.abs(origin.cy - target.cy) === 1;
        if (step.reset || !contiguous) {
          rp.queue = [];
          rp.nextStep = null;
          rp.fx = target.cx;
          rp.fy = target.cy;
        } else if (origin.cx !== target.cx || origin.cy !== target.cy) {
          rp.queue.push(target);
          if (rp.queue.length > 24) rp.queue.splice(0, rp.queue.length - 24);
        }
        rp.tx = target.cx;
        rp.ty = target.cy;
        rp.lastMovementSequence = step.sequence;
      }
      rp.bubble = p.bubble || null;
    }
  }
  for (const id of Array.from(remoteMap.keys())) {
    if (!activeIds.has(id)) remoteMap.delete(id);
  }
}

export function tickRemotePlayers(remoteMap, dt) {
  for (const rp of remoteMap.values()) {
    if (!rp.nextStep && rp.queue && rp.queue.length > 0) {
      rp.nextStep = rp.queue.shift();
    }
    const targetX = rp.nextStep ? rp.nextStep.cx : rp.tx;
    const targetY = rp.nextStep ? rp.nextStep.cy : rp.ty;
    const dx = targetX - rp.fx;
    const dy = targetY - rp.fy;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.02) {
      rp.dir = Math.abs(dx) >= Math.abs(dy)
        ? (dx >= 0 ? "se" : "nw")
        : (dy >= 0 ? "sw" : "ne");
      const step = Math.min(dist, dt * 3.8);
      rp.fx += (dx / dist) * step;
      rp.fy += (dy / dist) * step;
      rp.wt += dt * 6;
    } else {
      rp.fx = targetX;
      rp.fy = targetY;
      if (rp.nextStep) {
        rp.nextStep = rp.queue && rp.queue.length > 0 ? rp.queue.shift() : null;
      }
      if (!rp.nextStep) rp.wt = 0;
    }
  }
}

export function drawRemotePlayer(wctx, rp, tileTop, HTH, tNow) {
  const c = tileTop(rp.fx, rp.fy);
  const cxp = c.x;
  const cyp = c.y + HTH;
  const isMoving = rp.wt > 0;

  // Ombra a terra
  wctx.fillStyle = "rgba(25,22,40,0.28)";
  wctx.beginPath();
  wctx.ellipse(cxp, cyp + 5, 12, 5, 0, 0, Math.PI * 2);
  wctx.fill();

  // Sprite chibi ufficiale con vero outfit
  const D = rp.avatar[rp.dir] || rp.avatar.se;
  const sp = isMoving
    ? D.walk[Math.floor(rp.wt) % 4]
    : D.idle[Math.floor(tNow * 1.3) % 2];
  const bob = isMoving ? -Math.abs(Math.sin(rp.wt * 1.2)) * 1.4 : 0;
  const drawY = Math.round(cyp + 6 - sp.feet.y + bob);
  wctx.drawImage(sp.cv, Math.round(cxp - sp.feet.x), drawY);

  // Nametag badge con punto verde online
  wctx.save();
  wctx.font = "bold 9px 'Segoe UI', system-ui, sans-serif";
  const tw = wctx.measureText(rp.gamertag).width;
  const pw = tw + 18;
  const tagX = Math.round(cxp - pw / 2);
  const tagY = drawY - 14;

  wctx.fillStyle = "rgba(16,22,38,0.88)";
  wctx.beginPath();
  wctx.roundRect ? wctx.roundRect(tagX, tagY, pw, 14, 4) : wctx.rect(tagX, tagY, pw, 14);
  wctx.fill();
  wctx.strokeStyle = "rgba(255,255,255,0.24)";
  wctx.lineWidth = 1;
  wctx.stroke();

  // Punto verde online
  wctx.fillStyle = "#52b788";
  wctx.beginPath();
  wctx.arc(tagX + 7, tagY + 7, 3, 0, Math.PI * 2);
  wctx.fill();

  // Testo gamertag
  wctx.fillStyle = "#ffffff";
  wctx.textAlign = "left";
  wctx.textBaseline = "middle";
  wctx.fillText(rp.gamertag, tagX + 13, tagY + 7);

  // Fumetto chat se presente
  if (rp.bubble && rp.bubble.text && rp.bubble.expiresAt > Date.now()) {
    drawChatBubble(wctx, cxp, tagY - 8, rp.bubble.text);
  }

  wctx.restore();
}

function drawChatBubble(wctx, x, y, text) {
  wctx.font = "10px 'Segoe UI', system-ui, sans-serif";
  const maxW = 140;
  const tw = Math.min(maxW, wctx.measureText(text).width);
  const bw = tw + 16;
  const bh = 20;
  const bx = Math.round(x - bw / 2);
  const by = Math.round(y - bh);

  wctx.fillStyle = "#ffffff";
  wctx.beginPath();
  wctx.roundRect ? wctx.roundRect(bx, by, bw, bh, 6) : wctx.rect(bx, by, bw, bh);
  wctx.fill();
  wctx.strokeStyle = "#1a1f36";
  wctx.lineWidth = 1.2;
  wctx.stroke();

  wctx.fillStyle = "#ffffff";
  wctx.beginPath();
  wctx.moveTo(x - 4, by + bh);
  wctx.lineTo(x, by + bh + 5);
  wctx.lineTo(x + 4, by + bh);
  wctx.closePath();
  wctx.fill();

  wctx.fillStyle = "#111827";
  wctx.textAlign = "center";
  wctx.textBaseline = "middle";
  wctx.fillText(text, x, by + bh / 2, maxW - 4);
}
