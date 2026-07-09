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
 */
export function ScreenshotButton() {
  const [status, setStatus] = React.useState<Status>('idle');

  const resetSoon = React.useCallback((next: Status) => {
    setStatus(next);
    window.setTimeout(() => setStatus('idle'), 2200);
  }, []);

  const handleCapture = React.useCallback(async () => {
    if (status === 'capturing') return;
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
        // Nitidezza raddoppiata: utile per leggere testo/bug negli screen.
        scale: Math.min(2, window.devicePixelRatio || 1) * 1.5,
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
      ? 'rgba(22, 163, 74, 0.55)'
      : status === 'error'
        ? 'rgba(220, 38, 38, 0.55)'
        : 'rgba(255, 255, 255, 0.10)';

  return (
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
        border: '1px solid rgba(255,255,255,0.22)',
        background: bg,
        color: '#fff',
        cursor: status === 'capturing' ? 'progress' : 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        opacity: status === 'idle' ? 0.55 : 1,
        transition: 'background 160ms ease, opacity 160ms ease, transform 120ms ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        if (status === 'idle') e.currentTarget.style.opacity = '0.55';
      }}
    >
      <Icon
        size={17}
        style={status === 'capturing' ? { animation: 'brx-shot-spin 0.9s linear infinite' } : undefined}
      />
      <style>{`@keyframes brx-shot-spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}
