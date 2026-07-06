'use client';

import { Loader2 } from 'lucide-react';
import type { CaptureQueueItem } from '@/hooks/scanner/scanner-types';
import { cn } from '@/lib/utils';

export function CaptureShutter({
  onCapture,
  disabled,
  processingCount,
}: {
  onCapture: () => void;
  disabled?: boolean;
  processingCount: number;
}) {
  return (
    <div className="absolute bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
      {processingCount > 0 && (
        <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md">
          {processingCount} in analisi…
        </span>
      )}
      <button
        type="button"
        onClick={onCapture}
        disabled={disabled}
        aria-label="Scatta foto carta"
        className={cn(
          'flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-[3px] border-white bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition active:scale-95 disabled:opacity-50',
        )}
      >
        <span className="h-[3.1rem] w-[3.1rem] rounded-full bg-white" />
      </button>
      <p className="text-[11px] font-medium text-white/70">Scatta · puoi fare più foto di fila</p>
    </div>
  );
}

function QueueThumb({ item, onSelect }: { item: CaptureQueueItem; onSelect: () => void }) {
  const ring =
    item.status === 'ready'
      ? 'ring-2 ring-emerald-400'
      : item.status === 'error'
        ? 'ring-2 ring-red-400'
        : item.status === 'processing'
          ? 'ring-2 ring-[#FF7300]'
          : 'ring-1 ring-white/20';

  return (
    <button
      type="button"
      onClick={item.status === 'ready' ? onSelect : undefined}
      disabled={item.status !== 'ready'}
      className={cn(
        'relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-black/40',
        ring,
        item.status === 'ready' && 'cursor-pointer hover:brightness-110',
      )}
      aria-label={
        item.status === 'ready'
          ? `Rivedi ${item.result?.card_name ?? 'carta'}`
          : item.status === 'error'
            ? 'Identificazione fallita'
            : 'In analisi'
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
      {(item.status === 'queued' || item.status === 'processing') && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/45">
          <Loader2 className="h-4 w-4 animate-spin text-[#FF7300]" aria-hidden />
        </span>
      )}
      {item.status === 'error' && (
        <span className="absolute inset-0 flex items-center justify-center bg-red-950/60 text-[10px] font-bold text-red-200">
          ?
        </span>
      )}
    </button>
  );
}

export function CaptureQueuePanel({
  queue,
  reviewItemId,
  onSelect,
  onDismiss,
}: {
  queue: CaptureQueueItem[];
  reviewItemId: string | null;
  onSelect: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (queue.length === 0) return null;

  const readyCount = queue.filter((q) => q.status === 'ready').length;

  return (
    <div className="absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 px-3">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/15 bg-[#0a0f1a]/75 px-3 py-2.5 backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
            Coda scatti ({queue.length})
          </p>
          {readyCount > 0 && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              {readyCount} pront{readyCount === 1 ? 'a' : 'e'}
            </span>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {queue.map((item) => (
            <div key={item.id} className="relative shrink-0">
              <QueueThumb item={item} onSelect={() => onSelect(item.id)} />
              {reviewItemId === item.id && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#FF7300] ring-2 ring-[#0a0f1a]" />
              )}
              {(item.status === 'error' || item.status === 'ready') && (
                <button
                  type="button"
                  onClick={() => onDismiss(item.id)}
                  className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[9px] font-bold text-black"
                  aria-label="Rimuovi"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
