'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, X } from 'lucide-react';
import { getPublicProfileAction, sendFriendRequestAction } from '@/actions/social';
import { Button } from '@/components/ui/button';

interface AddFriendPromptProps {
  gamertag: string;
  myGamertag?: string | null;
  onClose: () => void;
}

export function AddFriendPrompt({ gamertag, myGamertag, onClose }: AddFriendPromptProps) {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'ask' | 'self' | 'friend' | 'pending' | 'sent'>('ask');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (myGamertag && myGamertag.toLowerCase() === gamertag.toLowerCase()) {
      setStatus('self');
      setLoading(false);
      return;
    }
    let cancelled = false;
    getPublicProfileAction(gamertag).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok || !result.data) {
        setError(result.error ?? 'Giocatore non trovato.');
        return;
      }
      if (result.data.friendship === 'self') setStatus('self');
      else if (result.data.friendship === 'friend') setStatus('friend');
      else if (result.data.friendship === 'pending_sent' || result.data.friendship === 'pending_received') {
        setStatus('pending');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [gamertag, myGamertag]);

  if (!mounted) return null;

  const handleAdd = async () => {
    setBusy(true);
    setError(null);
    const result = await sendFriendRequestAction(gamertag);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Impossibile inviare la richiesta.');
      return;
    }
    setStatus('sent');
  };

  const title =
    status === 'self'
      ? 'Questo è il tuo codice amici'
      : status === 'friend'
        ? `Sei già amico di ${gamertag}`
        : status === 'pending' || status === 'sent'
          ? `C’è già una richiesta di amicizia con ${gamertag}`
          : `${gamertag}, vuoi aggiungerlo agli amici?`;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[960] grid place-items-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aggiungi amico"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 p-6 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[#FF7300]/20 blur-3xl" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#FF7300]">
          <UserPlus className="h-6 w-6" />
        </span>
        <h2 className="mt-4 pr-8 text-xl font-black tracking-tight">{loading ? 'Controllo profilo…' : title}</h2>
        {error && <p className="mt-2 text-sm font-semibold text-red-300">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-2.5">
          {status === 'ask' && !loading && !error ? (
            <>
              <Button
                type="button"
                disabled={busy}
                onClick={() => void handleAdd()}
                className="h-11 min-w-[5.5rem] rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-5 text-sm font-black text-white hover:brightness-105"
              >
                Sì
              </Button>
              <Button
                type="button"
                onClick={onClose}
                className="h-11 min-w-[5.5rem] rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white hover:bg-white/15"
              >
                No
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl bg-white px-5 text-sm font-black text-slate-900 hover:bg-slate-100"
            >
              Chiudi
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
