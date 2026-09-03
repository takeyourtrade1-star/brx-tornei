'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, CircleHelp, Copy, Printer, X } from 'lucide-react';

/** Guida rapida ai proxy, disponibile anche senza uscire dall'arsenale. */
export function ProxyInfoPopover() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();
  const titleId = `${popoverId}-title`;
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const visible = open || hovered || focused;

  const close = useCallback(() => {
    setOpen(false);
    setHovered(false);
    setFocused(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && containerRef.current?.contains(event.target)) return;
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, visible]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !containerRef.current?.contains(nextTarget)) {
          setFocused(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={visible}
        aria-controls={popoverId}
        aria-haspopup="dialog"
        onClick={() => {
          if (open) {
            close();
            return;
          }
          setHovered(false);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/55 transition-colors hover:text-marquee focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marquee/70"
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
        Come funziona?
      </button>

      {visible ? (
        <div
          id={popoverId}
          role="dialog"
          aria-labelledby={titleId}
          className="absolute right-0 top-full z-50 mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-marquee/25 bg-header-bg/95 text-left text-white shadow-2xl shadow-black/70 backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-marquee">
                Proxy
              </p>
              <h2 id={titleId} className="mt-0.5 font-display text-base font-black tracking-tight">
                Come funzionano?
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Chiudi guida proxy"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marquee/70"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-3 px-4 py-3.5 text-[11px] leading-relaxed text-white/65">
            <div className="flex items-start gap-2.5">
              <Copy className="mt-0.5 h-4 w-4 shrink-0 text-marquee" aria-hidden="true" />
              <p>
                Un proxy è una riproduzione stampata usata al posto della carta originale.
                Deve rendere subito riconoscibili nome, immagine, simboli e testo della carta.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2.5">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-300">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Quali accettiamo
              </p>
              <p>
                Proxy a colori, in scala 1:1 e perfettamente leggibili delle carte originali.
                Niente immagini tagliate, illeggibili o modificate per nascondere informazioni.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <Printer className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-primary">
                  Come crearli
                </p>
                <ol className="list-decimal space-y-0.5 pl-4">
                  <li>Prepara l&apos;immagine della carta che vuoi riprodurre.</li>
                  <li>Impaginala in formato carta standard e stampala a colori.</li>
                  <li>Ritaglia il proxy e inseriscilo in una sleeve opaca davanti a una carta comune.</li>
                  <li>Controlla prima della partita che ogni dettaglio sia leggibile.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
