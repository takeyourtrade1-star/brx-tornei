'use client';

import { useCallback, useState, useTransition } from 'react';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { addScannedCardAction } from '@/actions/inventory';
import { ScannerModal } from '@/components/feature/scanner/ScannerModal';
import type { ScanResult } from '@/hooks/scanner/scanner-types';
import type { ResolveScanResult } from '@/types/resolve-scan';
import { CardLegalityBadges } from './card-legality-badges';

interface InventoryScanPanelProps {
  onCardAdded: (result: ResolveScanResult) => void;
}

interface RecentScan {
  id: string;
  result: ResolveScanResult;
  at: string;
}

export function InventoryScanPanel({ onCardAdded }: InventoryScanPanelProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleScanResult = useCallback(
    (scan: ScanResult) => {
      setError(null);
      setPendingMessage(`Aggiungo ${scan.card_name}…`);
      startTransition(async () => {
        const res = await addScannedCardAction({
          cardName: scan.card_name,
          setCode: scan.set_code,
          setName: scan.set_name,
          imageUri: scan.image_uri,
        });

        if ('error' in res) {
          setError(res.error);
          setPendingMessage(null);
          return;
        }

        setPendingMessage(null);
        setRecentScans((prev) => [
          {
            id: `${Date.now()}-${scan.card_name}`,
            result: res.data,
            at: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]);
        onCardAdded(res.data);
      });
    },
    [onCardAdded]
  );

  return (
    <section className="rounded-2xl border border-[#FF7300]/25 bg-gradient-to-br from-[#FF7300]/10 to-transparent p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-sans text-lg font-semibold text-white">
            Scansiona con Camera Match
          </h2>
          <p className="mt-1 max-w-xl text-sm text-white/60">
            Inquadra le carte: le associamo al catalogo, le aggiungiamo al tuo inventario e
            Scryfall ne verifica subito legalità e ban per ogni formato.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          disabled={isPending}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Camera className="h-4 w-4" aria-hidden />
          )}
          Avvia scanner
        </button>
      </div>

      {(pendingMessage || error) && (
        <div className="mt-3">
          {pendingMessage && (
            <p className="text-xs text-[#F3C76A]">{pendingMessage}</p>
          )}
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      )}

      {recentScans.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">
            Ultime scansioni
          </p>
          <ul className="flex flex-col gap-2">
            {recentScans.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">
                    {entry.result.card.name}
                  </p>
                  <p className="text-[10px] text-white/50">
                    {entry.result.wasAlreadyOwned
                      ? `Qtà aggiornata: ${entry.result.inventoryItem.quantity}`
                      : 'Aggiunta al inventario'}
                  </p>
                  <div className="mt-1">
                    <CardLegalityBadges
                      legalities={entry.result.card.tournamentLegalities}
                      compact
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {scannerOpen && (
        <ScannerModal
          batchMode
          onConfirm={() => {}}
          onConfirmResult={handleScanResult}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </section>
  );
}
