'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Swords, X } from 'lucide-react';
import { FORMATS } from '@/lib/data/catalog';
import { sendGameChallengeAction } from '@/actions/social';
import { Button } from '@/components/ui/button';

interface DirectChallengeModalProps {
  targetGamertag: string | null;
  open: boolean;
  onClose: () => void;
}

export function DirectChallengeModal({ targetGamertag, open, onClose }: DirectChallengeModalProps) {
  const [format, setFormat] = useState('modern');
  const [bestOf, setBestOf] = useState<'BO1' | 'BO3' | 'BO5'>('BO3');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSending(false);
      setSent(false);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !mounted || !targetGamertag) return null;

  const handleSend = async () => {
    setSending(true);
    const res = await sendGameChallengeAction(targetGamertag, format, bestOf);
    setSending(false);
    if (res.ok) {
      setSent(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[1000] grid place-items-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Sfida ${targetGamertag}`}
        className="relative w-full max-w-sm rounded-2xl border border-slate-900/[0.1] bg-white p-5 shadow-2xl transition-all sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500/10 text-orange-600">
              <Swords className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900">Sfida a Duello</h3>
              <p className="text-[11px] font-bold text-slate-400">vs {targetGamertag}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {sent ? (
          <div className="py-8 text-center space-y-2">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <p className="text-sm font-black text-slate-800">Sfida inviata a {targetGamertag}!</p>
            <p className="text-xs text-slate-400 font-medium">In attesa che accetti il duello…</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Formato di Gioco
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 focus:border-primary focus:bg-white focus:outline-none"
              >
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
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
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
