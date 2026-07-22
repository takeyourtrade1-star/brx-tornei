import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Monitor,
  RefreshCw,
  ShieldAlert,
  Wifi,
} from 'lucide-react';
import { WebcamTile } from '@/components/feature/tornei/match/webcam-tile';
import { hasTurn } from '@/lib/webrtc/ice-config';
import type { WebcamSource } from '@/types/webcam';
import { WebcamSourcePicker } from './webcam-source-picker';

interface WebcamLinkModalBodyProps {
  source: WebcamSource;
  busy?: boolean;
  pcError: string | null;
  phoneFailed: boolean;
  lastError: string | null;
  insecure: boolean;
  url: string;
  phoneReady: boolean;
  pcReady: boolean;
  previewStream: MediaStream | null;
  rtt: number | null;
  onSourceChange: (source: WebcamSource) => void;
  onRestart: () => void;
}

export function WebcamLinkModalBody({
  source,
  busy,
  pcError,
  phoneFailed,
  lastError,
  insecure,
  url,
  phoneReady,
  pcReady,
  previewStream,
  rtt,
  onSourceChange,
  onRestart,
}: WebcamLinkModalBodyProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-1">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white/40">Sorgente</p>
        <WebcamSourcePicker value={source} onChange={onSourceChange} disabled={busy} />
      </div>

      {source === 'pc' && pcError && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/15 px-3 py-2.5 text-sm font-semibold text-white">
          {pcError}
        </p>
      )}

      {source === 'phone' && phoneFailed && (
        <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/15 p-4 text-center">
          <AlertTriangle className="mx-auto h-5 w-5 text-white" aria-hidden="true" />
          <p className="text-sm text-white/80">{lastError ?? 'Connessione col telefono non riuscita. Verifica la rete e riprova.'}</p>
          <button type="button" onClick={onRestart} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-2 text-sm font-bold text-white">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Nuovo QR
          </button>
        </div>
      )}

      {source === 'phone' && !phoneReady && !phoneFailed && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          {insecure && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200/90">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Per collegare il telefono serve una connessione HTTPS e la stessa rete Wi-Fi.</span>
            </div>
          )}
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="shrink-0 rounded-2xl border border-white/15 bg-white p-3">
              {url ? <QRCodeSVG value={url} size={150} level="M" /> : null}
            </div>
            <ol className="flex-1 space-y-2.5 text-sm text-white/75">
              <SetupStep number="1">Inquadra il QR col telefono</SetupStep>
              <SetupStep number="2">Consenti la fotocamera</SetupStep>
              <SetupStep number="3">Torna qui per l’anteprima</SetupStep>
            </ol>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-white/55">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
            In attesa del telefono…
          </div>
          {!hasTurn() && (
            <p className="text-center text-xs text-white/45">
              <Wifi className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              Per un collegamento stabile, tieni telefono e PC sulla stessa rete Wi-Fi.
            </p>
          )}
        </div>
      )}

      {source === 'pc' && !pcReady && !pcError && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-10 text-sm text-white/55">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          Avvio webcam del PC…
        </div>
      )}

      {previewStream && (
        <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-white/15">
          <WebcamTile stream={previewStream} username="Anteprima" feedLabel={source === 'phone' ? 'Telefono' : 'PC'} />
          {phoneReady && <PreviewBadge icon="phone" label={`Connesso${rtt != null ? ` · ${rtt} ms` : ''}`} />}
          {pcReady && <PreviewBadge icon="pc" label="Webcam PC attiva" />}
        </div>
      )}
    </div>
  );
}

function SetupStep({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-black text-primary">{number}</span>
      {children}
    </li>
  );
}

function PreviewBadge({ icon, label }: { icon: 'phone' | 'pc'; label: string }) {
  const Icon = icon === 'phone' ? CheckCircle2 : Monitor;
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full border border-emerald-400/40 bg-black/55 px-2 py-1 text-xs font-semibold text-emerald-300">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </div>
  );
}
