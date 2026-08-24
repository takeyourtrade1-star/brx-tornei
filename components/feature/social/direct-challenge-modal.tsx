'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Check, Loader2, Swords, X } from 'lucide-react';
import { FORMATS } from '@/lib/data/catalog';
import {
  cancelGameChallengeAction,
  checkOutgoingChallengeStatusAction,
  sendGameChallengeAction,
} from '@/actions/social-challenges';
import { Button } from '@/components/ui/button';

interface DirectChallengeModalProps {
  targetGamertag: string | null;
  open: boolean;
  onClose: () => void;
}

export function DirectChallengeModal({ targetGamertag, open, onClose }: DirectChallengeModalProps) {
  const router = useRouter();
  const [format, setFormat] = useState('modern');
  const [bestOf, setBestOf] = useState<'BO1' | 'BO3' | 'BO5'>('BO3');
  const [sending, setSending] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<
    'idle' | 'waiting' | 'accepted' | 'declined' | 'expired' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSending(false);
      setActiveChallengeId(null);
      setChallengeStatus('idle');
      setStatusMessage(null);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && challengeStatus !== 'waiting') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, challengeStatus]);

  // Polling per rilevare quando l'amico accetta o rifiuta la sfida
  useEffect(() => {
    if (!activeChallengeId || challengeStatus !== 'waiting') return;

    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      const res = await checkOutgoingChallengeStatusAction(activeChallengeId);
      if (cancelled || !res.ok || !res.data) return;

      if (res.data.status === 'accepted' && res.data.tableId) {
        const tableId = res.data.tableId;
        setChallengeStatus('accepted');
        setStatusMessage('Sfida accettata! Ingresso al tavolo in corso…');
        onClose();
        router.push(`/tornei/${tableId}/live`);
      } else if (res.data.status === 'declined') {
        setChallengeStatus('declined');
        setStatusMessage(`${targetGamertag} ha rifiutato la sfida.`);
      } else if (res.data.status === 'expired') {
        setChallengeStatus('expired');
        setStatusMessage('La sfida è scaduta senza risposta.');
      }
    };

    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeChallengeId, challengeStatus, targetGamertag, onClose, router]);

  if (!open || !mounted || !targetGamertag) return null;

  const handleSend = async () => {
    setSending(true);
    setStatusMessage(null);
    const res = await sendGameChallengeAction(targetGamertag, format, bestOf);
    setSending(false);

    if (res.ok && res.data) {
      setActiveChallengeId(res.data.id);
      if (res.data.status === 'accepted' && res.data.tableId) {
        const tableId = res.data.tableId;
        setChallengeStatus('accepted');
        setStatusMessage('Sfida accettata! Ingresso al tavolo in corso…');
        onClose();
        router.push(`/tornei/${tableId}/live`);
      } else {
        setChallengeStatus('waiting');
      }
    } else {
      setChallengeStatus('error');
      setStatusMessage(res.error ?? 'Impossibile inviare la sfida.');
    }
  };

  const handleCancel = async () => {
    if (activeChallengeId) {
      await cancelGameChallengeAction(activeChallengeId);
    }
    onClose();
  };

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[1000] grid place-items-center p-4" onClick={challengeStatus === 'waiting' ? undefined : onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Sfida ${targetGamertag}`}
        className="arena-panel relative w-full max-w-sm p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500/15 text-primary">
              <Swords className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white">Sfida a Duello</h3>
              <p className="text-[11px] font-bold text-white/45">vs {targetGamertag}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={challengeStatus === 'waiting' ? handleCancel : onClose}
            aria-label="Chiudi"
            className="grid h-8 w-8 place-items-center rounded-full text-white/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {challengeStatus === 'waiting' ? (
          <div className="py-7 text-center space-y-3 animate-in fade-in duration-200">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-orange-500/15 text-[#FF7300]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-black text-white">In attesa di {targetGamertag}…</p>
              <p className="mt-1 text-xs font-medium text-white/50">
                Riceverai la connessione automatica al tavolo appena accetta.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-2 text-xs font-bold text-white/40 transition hover:text-red-300"
            >
              Annulla sfida
            </button>
          </div>
        ) : challengeStatus === 'accepted' ? (
          <div className="py-8 text-center space-y-2 animate-in fade-in duration-200">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
              <Check className="h-6 w-6" />
            </div>
            <p className="text-sm font-black text-white">{statusMessage}</p>
          </div>
        ) : challengeStatus === 'declined' || challengeStatus === 'expired' || challengeStatus === 'error' ? (
          <div className="py-7 text-center space-y-3 animate-in fade-in duration-200">
            <p className="text-sm font-bold text-white">{statusMessage}</p>
            <Button
              type="button"
              onClick={() => {
                setChallengeStatus('idle');
                setStatusMessage(null);
              }}
              className="h-9 rounded-xl bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20"
            >
              Riprova
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-white/45">
                Formato di Gioco
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-bold text-white focus:border-primary focus:outline-none"
              >
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-white/45">
                Formula del Match
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['BO1', 'BO3', 'BO5'] as const).map((rule) => (
                  <button
                    key={rule}
                    type="button"
                    onClick={() => setBestOf(rule)}
                    className={`h-9 rounded-xl border text-xs font-black transition ${
                      bestOf === rule
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-white/15 bg-white/5 text-white/65 hover:bg-white/10'
                    }`}
                  >
                    {rule}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              disabled={sending}
              onClick={handleSend}
              className="mt-2 h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] text-xs font-black uppercase tracking-wider text-white shadow-md hover:brightness-105"
            >
              <Swords className="h-4 w-4" />
              <span>{sending ? 'Invio in corso…' : 'Lancia il Guanto di Sfida'}</span>
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
