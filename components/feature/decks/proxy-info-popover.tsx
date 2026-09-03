'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CircleHelp, Copy, Printer, X } from 'lucide-react';

/** Guida rapida ai proxy, disponibile anche senza uscire dall'arsenale. */
export function ProxyInfoPopover() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimerRef = useRef<number | null>(null);
  const popoverId = useId();
  const titleId = `${popoverId}-title`;
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const visible = open || hovered || focused;

  const cancelHoverClose = useCallback(() => {
    if (hoverCloseTimerRef.current === null) return;
    window.clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = null;
  }, []);

  const scheduleHoverClose = useCallback(() => {
    cancelHoverClose();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      hoverCloseTimerRef.current = null;
      setHovered(false);
    }, 180);
  }, [cancelHoverClose]);

  const syncFocus = useCallback(() => {
    const activeElement = document.activeElement;
    const inside = activeElement instanceof Node
      && (containerRef.current?.contains(activeElement) || popoverRef.current?.contains(activeElement));
    setFocused(Boolean(inside));
  }, []);

  const close = useCallback(() => {
    cancelHoverClose();
    setOpen(false);
    setHovered(false);
    setFocused(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, [cancelHoverClose]);

  useEffect(() => {
    if (!visible) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node
        && (containerRef.current?.contains(event.target) || popoverRef.current?.contains(event.target))
      ) return;
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

  useEffect(() => () => cancelHoverClose(), [cancelHoverClose]);

  const updatePopoverPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.max(0, Math.min(368, window.innerWidth - 32));
    const maxLeft = Math.max(16, window.innerWidth - width - 16);
    const left = Math.min(Math.max(16, rect.right - width), maxLeft);
    setPopoverPosition({ top: rect.bottom + 8, left });
  }, []);

  useEffect(() => {
    if (!visible) {
      setPopoverPosition(null);
      return;
    }

    updatePopoverPosition();
    const handleViewportChange = () => updatePopoverPosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [updatePopoverPosition, visible]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        cancelHoverClose();
        setHovered(true);
      }}
      onMouseLeave={scheduleHoverClose}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => window.setTimeout(syncFocus, 0)}
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
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/55 transition-colors hover:text-marquee focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marquee/70"
      >
        <CircleHelp className="h-3 w-3" aria-hidden="true" />
        Come funzionano le proxy
      </button>

      {visible && popoverPosition && typeof document !== 'undefined'
        ? createPortal(
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-labelledby={titleId}
          onMouseEnter={() => {
            cancelHoverClose();
            setHovered(true);
          }}
          onMouseLeave={scheduleHoverClose}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={() => window.setTimeout(syncFocus, 0)}
          className="fixed z-[1000] w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-marquee/25 bg-header-bg/95 text-left text-white shadow-2xl shadow-black/70 backdrop-blur-xl"
          style={{ top: popoverPosition.top, left: popoverPosition.left }}
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

            <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5">
              <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-primary">
                Il gioco viene prima
              </p>
              <p>
                Per Ebartex il valore di una partita sta nelle persone al tavolo, non nel
                prezzo delle carte. Per questo ammettiamo proxy conformi: tutti devono poter
                giocare e divertirsi, anche senza possedere carte rare o molto costose.
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

            <p className="border-l-2 border-marquee/40 pl-2.5 text-white/55">
              Nei futuri tornei creati dalla community, ogni organizzatore potrà decidere in
              autonomia se ammettere le proxy e indicare le regole del proprio evento.
            </p>
          </div>
        </div>,
          document.body,
        )
        : null}
    </div>
  );
}
