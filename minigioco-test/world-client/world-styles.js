import { getCspNonce } from '../csp-nonce';
import { TUTORIAL_CSS } from './tutorial-styles';

const WORLD_CSS = `
.irg-root{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;font-family:var(--font-sans,system-ui);user-select:none;isolation:isolate}
.irg-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.irg-helper{z-index:15}
.irg-root .asso-diorama{display:none}
.irg-root[data-world-quality="high"] .asso-diorama{display:block}
.irg-root[data-world-quality="high"] .asso-mascot>i{visibility:hidden}
.irg-root[data-world-quality="high"] .irg-helper-asso{filter:drop-shadow(0 5px 10px rgba(0,0,0,.18));width:44px;height:58px}
.irg-canvas:focus-visible{outline:2px solid currentColor;outline-offset:-3px}
.irg-m-arcade{width:min(1100px,96vw);height:calc(100% - 40px);max-height:calc(100% - 40px);display:flex;flex-direction:column;padding:0;overflow:hidden}
.irg-m-mirror{width:min(780px,96vw);max-width:100%}
.irg-root.irg-powering{pointer-events:none;animation:irgPowerOff .64s ease-in forwards;transform-origin:center}
@keyframes irgPowerOff{0%{transform:scaleY(1);opacity:1}65%{transform:scaleY(.01);opacity:1}100%{transform:scaleY(.01) scaleX(0);opacity:0}}
.irg-quality-low .irg-helper-asso,.irg-quality-low .irg-tut-ghost,.irg-quality-low .irg-tut-eyes{animation:none}
@media(max-width:600px){.irg-helper{right:12px;bottom:140px;top:auto;transform:none}.irg-tut{top:126px}.irg-tut-bar{max-height:calc(100dvh - 180px);overflow:auto}.irg-tut-intro,.irg-tut-final{top:50%}}
@media(prefers-reduced-motion:reduce){.irg-root *,.irg-root *::before,.irg-root *::after{animation:none!important;transition:none!important}.irg-root.irg-powering{animation:none}}
`;

let users = 0;

/** Uno stile condiviso, con nonce CSP e rimozione all'ultimo smontaggio. */
export function mountWorldStyles() {
  users += 1;
  if (!document.getElementById('irg-css')) {
    const style = document.createElement('style');
    style.id = 'irg-css';
    const nonce = getCspNonce();
    if (nonce) style.setAttribute('nonce', nonce);
    style.textContent = `${TUTORIAL_CSS}\n${WORLD_CSS}`;
    document.head.appendChild(style);
  }
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    users = Math.max(0, users - 1);
    if (!users) document.getElementById('irg-css')?.remove();
  };
}
