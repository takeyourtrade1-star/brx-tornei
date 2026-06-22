import { useEffect, useRef } from "react";

/* ============================================================================
   game-kit — utilità condivise dai minigiochi della Sala Arcade.
   Canvas 2D puro, niente dipendenze oltre React. Ogni gioco usa:
     - useArcadeCanvas(): sizing DPR-correct + loop rAF + cleanup
     - i piccoli helper matematici/disegno
      - SHELL_CSS / le classi .ag-* per il telaio (iniettate da ArcadeGameModal)
   ========================================================================== */

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

/** path di rettangolo arrotondato (non riempie/traccia: ci pensa il chiamante) */
export function rr(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

/**
 * Aggancia un canvas a un wrapper: lo dimensiona (DPR), avvia un loop rAF e
 * pulisce tutto allo smontaggio. `onFrame(ctx, w, h, dt)` riceve dimensioni in
 * px logici (il contesto è già scalato per il devicePixelRatio).
 * `getOnFrame` permette di leggere sempre l'ultima closure senza riavviare.
 */
export function useArcadeCanvas(canvasRef, wrapRef, onFrame) {
  const frameRef = useRef(onFrame);
  frameRef.current = onFrame;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let last = performance.now();
    let W = 1, H = 1, dpr = 1;
    let alive = true;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, wrap.clientWidth);
      H = Math.max(1, wrap.clientHeight);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
    };
    resize();

    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(resize);
      ro.observe(wrap);
    } else {
      window.addEventListener("resize", resize);
    }

    const loop = (ts) => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      try {
        frameRef.current(ctx, W, H, dt);
      } catch (e) {
        /* un errore di frame non deve uccidere il loop */
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* CSS del telaio comune ai minigiochi (classi .ag-*). Iniettato una volta. */
export const SHELL_CSS = `
.ag-root{position:absolute;inset:0;z-index:70;display:flex;flex-direction:column;
  background:radial-gradient(120% 90% at 50% 0%,#16112e 0%,#0a0a16 60%,#050509 100%);
  font-family:'Press Start 2P','Segoe UI',system-ui,monospace;color:#eaf2ff;
  animation:agIn .3s ease-out both;user-select:none;touch-action:none;}
@keyframes agIn{0%{opacity:0;transform:scale(1.02)}100%{opacity:1;transform:scale(1)}}
.ag-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;z-index:3;}
.ag-back{appearance:none;cursor:pointer;font:inherit;font-size:8px;letter-spacing:.5px;color:#cfe;
  padding:9px 11px;border-radius:9px;border:1px solid rgba(5,217,232,.45);background:rgba(5,217,232,.08);
  transition:transform .12s,background .12s,box-shadow .12s;}
.ag-back:hover{background:rgba(5,217,232,.2);box-shadow:0 0 14px rgba(5,217,232,.4);}
.ag-back:active{transform:scale(.96);}
.ag-title{font-size:11px;letter-spacing:1px;color:#fff;text-shadow:0 0 10px var(--accent,#ff2a6d);}
.ag-stats{display:flex;gap:8px;font-size:8px;}
.ag-stat{padding:7px 10px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);white-space:nowrap;}
.ag-stat b{color:var(--accent,#ffd76e);}
.ag-stage{position:relative;flex:1;min-height:0;margin:0 12px 12px;border-radius:14px;overflow:hidden;
  border:2px solid var(--accent,#ff2a6d);box-shadow:inset 0 0 40px rgba(0,0,0,.6),0 0 24px rgba(0,0,0,.4);
  background:#04040a;}
.ag-stage canvas{display:block;width:100%;height:100%;image-rendering:pixelated;}
.ag-over{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:14px;text-align:center;padding:20px;background:rgba(5,5,14,.74);backdrop-filter:blur(2px);z-index:4;
  animation:agIn .25s ease-out both;}
.ag-over h2{margin:0;font-size:18px;letter-spacing:1px;color:#fff;text-shadow:0 0 16px var(--accent,#ff2a6d);}
.ag-over p{margin:0;font-size:9px;line-height:1.9;color:#aeb9d8;font-family:'Segoe UI',system-ui,sans-serif;max-width:340px;}
.ag-big{font-size:11px;color:var(--accent,#ffd76e);}
.ag-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}
.ag-btn{appearance:none;cursor:pointer;font:inherit;font-size:9px;letter-spacing:.5px;color:#0d0d1a;
  padding:12px 16px;border-radius:10px;border:0;background:var(--accent,#ff2a6d);
  box-shadow:0 0 16px var(--accent,#ff2a6d);transition:transform .12s,filter .12s;}
.ag-btn:hover{filter:brightness(1.12);transform:translateY(-2px);}
.ag-btn:active{transform:translateY(0) scale(.97);}
.ag-btn.ag-ghost{background:transparent;color:#eaf2ff;border:1px solid rgba(255,255,255,.3);box-shadow:none;}
.ag-hintbar{text-align:center;font-size:7px;letter-spacing:.5px;color:#7c87ad;padding:0 16px 12px;}
`;
