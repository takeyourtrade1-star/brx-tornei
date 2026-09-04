/* Binding DOM del mondo. Il listener resta globale per catturare i tasti anche
 * quando il canvas non ha il focus, ma accetta solo eventi appartenenti al
 * wrapper del gioco e non interferisce con i controlli dell'interfaccia. */

const EDITABLE_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A"]);

function elementOf(target) {
  if (!target) return null;
  if (target.nodeType === 3) return target.parentElement || null;
  return target;
}

function isEditableTarget(target) {
  const element = elementOf(target);
  if (!element) return false;
  const tag = String(element.tagName || "").toUpperCase();
  if (EDITABLE_TAGS.has(tag)) return true;
  if (element.isContentEditable === true) return true;
  if (typeof element.closest === "function") {
    try {
      return Boolean(element.closest("button,a,input,select,textarea,[contenteditable='true']"));
    } catch (error) {
      return false;
    }
  }
  return false;
}

function isInside(target, wrap) {
  if (!target || !wrap) return false;
  if (target === wrap) return true;
  if (typeof wrap.contains !== "function") return false;
  try {
    return wrap.contains(target);
  } catch (error) {
    return false;
  }
}

/** Guardia comune per keydown/keyup del motore. */
export function shouldHandleGameKey(event, wrap) {
  return Boolean(event)
    && event.defaultPrevented !== true
    && isInside(event.target, wrap)
    && !isEditableTarget(event.target);
}

function listen(target, type, handler) {
  if (!target || typeof target.addEventListener !== "function" || !handler) return () => {};
  target.addEventListener(type, handler);
  return () => target.removeEventListener(type, handler);
}

/**
 * Collega input e lifecycle del focus al motore legacy.
 * Restituisce una cleanup idempotente da chiamare in destroy.
 */
export function createWorldInputBindings({
  canvas,
  wrap,
  onPointerDown,
  onPointerMove,
  onPointerLeave,
  onKeyDown,
  onKeyUp,
  onBlur,
}) {
  if (!canvas || !wrap) throw new TypeError("canvas e wrap sono obbligatori");

  const documentRef = canvas.ownerDocument
    || (typeof document !== "undefined" ? document : null);
  const windowRef = documentRef && documentRef.defaultView
    ? documentRef.defaultView
    : (typeof window !== "undefined" ? window : null);
  const cleanups = [
    listen(canvas, "pointerdown", onPointerDown),
    listen(canvas, "pointermove", onPointerMove),
    listen(canvas, "pointerleave", onPointerLeave),
  ];
  const guardedKeyDown = typeof onKeyDown === "function"
    ? (event) => { if (shouldHandleGameKey(event, wrap)) onKeyDown(event); }
    : null;
  const guardedKeyUp = typeof onKeyUp === "function"
    ? (event) => { onKeyUp(event); }
    : null;
  cleanups.push(listen(windowRef, "keydown", guardedKeyDown));
  cleanups.push(listen(windowRef, "keyup", guardedKeyUp));

  const clearKeys = typeof onBlur === "function" ? () => onBlur() : null;
  cleanups.push(listen(windowRef, "blur", clearKeys));
  cleanups.push(listen(wrap, "focusout", clearKeys));
  const onVisibilityChange = documentRef && typeof onBlur === "function"
    ? () => { if (documentRef.hidden) onBlur(); }
    : null;
  cleanups.push(listen(documentRef, "visibilitychange", onVisibilityChange));
  const onFocusIn = documentRef && typeof onBlur === "function"
    ? (event) => {
      if (!isInside(event.target, wrap) || isEditableTarget(event.target)) onBlur();
    }
    : null;
  cleanups.push(listen(documentRef, "focusin", onFocusIn));

  let detached = false;
  return () => {
    if (detached) return;
    detached = true;
    cleanups.forEach((cleanup) => cleanup());
  };
}
