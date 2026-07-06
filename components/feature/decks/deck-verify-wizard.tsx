'use client';

import { useCallback, useState, useTransition } from 'react';
import { Camera, CheckCircle2, AlertTriangle } from 'lucide-react';
import { addScannedCardAction } from '@/actions/inventory';
import { saveDeckVerificationAction } from '@/actions/decks';
import { ScannerModal } from '@/components/feature/scanner/ScannerModal';
import type { ScanResult } from '@/hooks/scanner/scanner-types';
import { diffDeckVsScanned, type ScannedCardEntry } from '@/lib/deck-verification';
import type { Deck } from '@/types/deck';

interface DeckVerifyWizardProps {
  deck: Deck;
  onClose: () => void;
  onVerified: (deck: Deck) => void;
}

type Step = 'intro' | 'scan' | 'diff' | 'done';

export function DeckVerifyWizard({ deck, onClose, onVerified }: DeckVerifyWizardProps) {
  const [step, setStep] = useState<Step>('intro');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState<ScannedCardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const diff = diffDeckVsScanned(deck.main, deck.side, scanned);

  // Async + throw su errore: lo scanner mostra l'esito reale della scansione.
  const handleScanResult = useCallback(async (scan: ScanResult) => {
    const res = await addScannedCardAction({
      cardName: scan.card_name,
      setCode: scan.set_code,
      setName: scan.set_name,
      imageUri: scan.image_uri,
    });
    if ('error' in res) {
      setError(res.error);
      throw new Error(res.error);
    }
    setError(null);
    setScanned((prev) => [
      ...prev,
      {
        blueprintId: res.data.blueprintId,
        cardName: res.data.card.name,
        quantity: 1,
      },
    ]);
  }, []);

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await saveDeckVerificationAction({
        deckId: deck.id,
        status: diff.length === 0 ? 'verified' : 'mismatch',
        scannedEntries: scanned,
      });
      if ('error' in res) {
        setError(res.error);
        return;
      }
      setStep('done');
      onVerified(res.deck);
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#0a0f1a] p-5">
        <h3 className="font-display text-lg font-black uppercase text-white">
          Verifica mazzo fisico
        </h3>
        <p className="mt-1 text-xs text-white/55">{deck.name}</p>

        {step === 'intro' && (
          <div className="mt-4 space-y-3 text-sm text-white/70">
            <p>
              Scansiona le carte che userai fisicamente. Confronteremo lo scan con il mazzo
              dichiarato. In torneo, una discrepanza comporta squalifica e segnalazione allo staff.
            </p>
            <button
              type="button"
              onClick={() => {
                setStep('scan');
                setScannerOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF7300] px-4 py-2.5 text-xs font-bold uppercase text-white"
            >
              <Camera className="h-4 w-4" />
              Inizia scansione
            </button>
          </div>
        )}

        {step === 'scan' && (
          <div className="mt-4">
            <p className="text-xs text-white/60">
              Carte scansionate: {scanned.length} · Conferma ogni match nello scanner
            </p>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="mt-3 w-full rounded-full border border-white/20 py-2 text-xs font-bold uppercase text-white"
            >
              Continua a scansionare
            </button>
            <button
              type="button"
              onClick={() => setStep('diff')}
              disabled={scanned.length === 0}
              className="mt-2 w-full rounded-full bg-white/10 py-2 text-xs font-bold uppercase text-white disabled:opacity-40"
            >
              Confronta mazzo
            </button>
          </div>
        )}

        {step === 'diff' && (
          <div className="mt-4">
            {diff.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Tutte le carte combaciano con il mazzo dichiarato.
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  Discrepanze rilevate ({diff.length})
                </div>
                <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-amber-100">
                  {diff.map((d) => (
                    <li key={d.blueprintId}>
                      • {d.cardName}: dichiarate {d.declared}, scansionate {d.scanned}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirm}
              className="mt-3 w-full rounded-full bg-[#FF7300] py-2.5 text-xs font-bold uppercase text-white disabled:opacity-50"
            >
              {isPending ? 'Salvataggio…' : 'Conferma verifica'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <p className="mt-4 text-sm text-emerald-200">Verifica salvata.</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-xs text-white/50 underline"
        >
          Chiudi
        </button>

        {scannerOpen && (
          <ScannerModal
            batchMode
            onConfirm={() => {}}
            onConfirmResult={handleScanResult}
            onClose={() => setScannerOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
