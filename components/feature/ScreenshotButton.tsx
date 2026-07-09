'use client';

import * as React from 'react';
import { domToBlob } from 'modern-screenshot';
import { Camera, Check, Loader2, X } from 'lucide-react';

type Status = 'idle' | 'capturing' | 'done' | 'error';

/**
 * Bottone globale di cattura schermata per i tester.
 *
 * Al click salva un PNG di quello che c'è a schermo nei Download.
 * NON cattura i <video> (webcam 1v1): per privacy salva solo l'interfaccia del sito.
 * Pensato per il collaudo dei tornei: un click -> file da inviarci.
 *
 * Include un promemoria periodico ("Visto un bug? Fai uno screen…") che
 * appare ogni tanto di lato per ricordare ai tester di usare il bottone.
 */
const TIP_FIRST_DELAY_MS = 45_000; // primo promemoria dopo 45s
const TIP_INTERVAL_MS = 5 * 60_000; // poi ogni 5 minuti
const TIP_VISIBLE_MS = 10_000; // resta a schermo 10s

export function ScreenshotButton() {
  const [status, setStatus] = React.useState<Status>('idle');
  const [showTip, setShowTip] = React.useState(false);

  // Promemoria periodico per i tester.
  React.useEffect(() => {
    let hideTimer: number | undefined;
    const show = () => {
      setShowTip(true);
      hideTimer = window.setTimeout(() => setShowTip(false), TIP_VISIBLE_MS);
    };
    const firstTimer = window.setTimeout(show, TIP_FIRST_DELAY_MS);
    const interval = window.setInterval(show, TIP_INTERVAL_MS);
    return () => {
      window.clearTimeout(firstTimer);
      window.clearInterval(interval);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  const resetSoon = React.useCallback((next: Status) => {
    setStatus(next);
    window.setTimeout(() => setStatus('idle'), 2200);
  }, []);

  const handleCapture = React.useCallback(async () => {
    if (status === 'capturing') return;
    setShowTip(false);
    setStatus('capturing');

    try {
      const blob = await domToBlob(document.body, {
        filter: (node) => {
          if (node instanceof HTMLElement && node.dataset.screenshotIgnore === 'true') {
            return false;
          }
          // Privacy: non catturare le webcam (le persone). Solo l'interfaccia del sito.
          if (node instanceof HTMLVideoElement) return false;
          return true;
        },
        backgroundColor: '#0b0b0f',
        // Cap alla densità reale dello schermo: oltre (es. x3 su retina)
        // la rasterizzazione+encoding PNG impiega secondi invece di essere istantanea.
        scale: Math.min(2, window.devicePixelRatio || 1),
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      });

      if (!blob) throw new Error('Cattura non riuscita');

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const name = `brx-tornei_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.png`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Rilascia la memoria dopo che il download è partito.
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);

      resetSoon('done');
    } catch (err) {
      console.error('[ScreenshotButton]', err);
      resetSoon('error');
    }
  }, [status, resetSoon]);

  const label =
    status === 'capturing'
      ? 'Catturo…'
      : status === 'done'
        ? 'Salvato nei Download'
        : status === 'error'
          ? 'Errore, riprova'
          : 'Screenshot';

  const Icon =
    status === 'capturing'
      ? Loader2
      : status === 'done'
        ? Check
        : status === 'error'
          ? X
          : Camera;

  const bg =
    status === 'done'
      ? 'rgba(22, 163, 74, 0.85)'
      : status === 'error'
        ? 'rgba(220, 38, 38, 0.85)'
        : 'rgba(17, 17, 22, 0.60)';

  return (
    <>
      {showTip && (
        <div
          data-screenshot-ignore="true"
          role="status"
          style={{
            position: 'fixed',
            // Alla sinistra del bottone, sulla stessa riga (12px bordo + 38px bottone + 8px gap).
            top: 'max(12px, env(safe-area-inset-top))',
            right: '58px',
            zIndex: 2147483646,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '230px',
            minHeight: '38px',
            boxSizing: 'border-box',
            padding: '6px 10px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.35)',
            background: 'rgba(17, 17, 22, 0.78)',
            color: '#fff',
            font: '500 12px/1.3 var(--font-sans, system-ui, sans-serif)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'brx-tip-in 260ms ease-out',
          }}
        >
          <button
            type="button"
            onClick={handleCapture}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: 'inherit',
              font: 'inherit',
              textAlign: 'left',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <Camera size={16} style={{ flexShrink: 0 }} />
            <span>
              Visto un bug? <strong>Fai uno screen</strong> e mandacelo!
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowTip(false)}
            aria-label="Chiudi promemoria"
            style={{
              flexShrink: 0,
              display: 'flex',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              padding: '2px',
              cursor: 'pointer',
            }}
          >
            <X size={12} />
          </button>
          <style>{`@keyframes brx-tip-in{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}`}</style>
        </div>
      )}
    <button
      type="button"
      data-screenshot-ignore="true"
      onClick={handleCapture}
      title={label}
      aria-label={label}
      style={{
        position: 'fixed',
        top: 'max(12px, env(safe-area-inset-top))',
        right: '12px',
        zIndex: 2147483647,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        borderRadius: '9999px',
        border: '1px solid rgba(255,255,255,0.45)',
        background: bg,
        color: '#fff',
        cursor: status === 'capturing' ? 'progress' : 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'background 160ms ease, transform 120ms ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <Icon
        size={17}
        style={status === 'capturing' ? { animation: 'brx-shot-spin 0.9s linear infinite' } : undefined}
      />
      <style>{`@keyframes brx-shot-spin{to{transform:rotate(360deg)}}`}</style>
    </button>
    </>
  );
}
