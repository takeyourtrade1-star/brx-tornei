'use client';

import { useCallback, useState } from 'react';
import { Camera, CheckCircle2 } from 'lucide-react';
import { addScannedCardAction } from '@/actions/inventory';
import { ScannerModal } from '@/components/feature/scanner/ScannerModal';
import { AssoVisionEyes } from '@/components/feature/scanner/AssoVisionEyes';
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
  const [error, setError] = useState<string | null>(null);

  // Ritorna una promise: se il salvataggio fallisce lancia, così lo scanner
  // mostra l'errore invece di trattare la carta come aggiunta.
  const handleScanResult = useCallback(
    async (scan: ScanResult) => {
      setError(null);
      const res = await addScannedCardAction({
        cardName: scan.card_name,
        setCode: scan.set_code,
        setName: scan.set_name,
        scryfallId: scan.scryfall_id,
        imageUri: scan.image_uri,
      });

      if ('error' in res) {
        setError(res.error);
        throw new Error(res.error);
      }

      setRecentScans((prev) => [
        {
          id: `${Date.now()}-${scan.card_name}`,
          result: res.data,
          at: new Date().toISOString(),
        },
        ...prev.slice(0, 9),
      ]);
      onCardAdded(res.data);
    },
    [onCardAdded]
  );

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#FF7300]/25 bg-gradient-to-br from-[#FF7300]/12 via-[#FF7300]/5 to-transparent p-5 sm:p-6">
      <div
        className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#FF7300]/20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#FF7300]/30 bg-[#0a0f1a]/60 shadow-[0_6px_20px_rgba(255,115,0,0.18)]">
            <AssoVisionEyes size={40} active />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-black uppercase tracking-wide text-white">
                Asso Vision
              </h2>
              <span className="rounded-full border border-[#FF7300]/30 bg-[#FF7300]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FF7300]">
                Beta
              </span>
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/60">
              Inquadra le carte: <span className="font-semibold text-white/80">Asso</span> le riconosce,
              le aggiunge al tuo inventario e Asso Vision verifica subito legalità e ban per ogni formato.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_24px_rgba(255,115,0,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Camera className="h-4 w-4" aria-hidden />
          Avvia scanner
        </button>
      </div>

      {error && (
        <div className="mt-3">
          <p className="text-xs text-red-300">{error}</p>
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
