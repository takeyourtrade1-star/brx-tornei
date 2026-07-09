'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Check, LogOut, Plus, User, UserPlus, X } from 'lucide-react';
import { listDecksAction, createDeckAction } from '@/actions/decks';
import type { FormatId } from '@/lib/data/catalog';
import type { Deck } from '@/types/deck';
import { cn } from '@/lib/utils';

interface TableSeatModalProps {
  open: boolean;
  /** 'host' = tavolo mio (creato/in attesa); 'join' = sto per sedermi da altri. */
  mode: 'host' | 'join';
  formatId: FormatId;
  formatName: string;
  myUsername: string;
  opponentUsername?: string | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  /** Solo host: alzarsi dal tavolo. */
  onLeave?: () => void;
  /** Solo join: conferma e siediti (deckId vuoto = ignora deck). */
  onConfirmJoin?: (deckId: string) => void;
}

/** Sentinella deck: "Ignora deck". */
const IGNORE_DECK = '__ignore__';

export function TableSeatModal({
  open,
  mode,
  formatId,
  formatName,
  myUsername,
  opponentUsername,
  busy = false,
  error,
  onClose,
  onLeave,
  onConfirmJoin,
}: TableSeatModalProps) {
  const [mounted, setMounted] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selected, setSelected] = useState<string>(IGNORE_DECK);
  const [newDeckName, setNewDeckName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [loadingDecks, startLoad] = useTransition();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    startLoad(async () => {
      const res = await listDecksAction();
      if ('decks' in res) {
        const compatible = res.decks.filter((d) => d.formatId === formatId);
        setDecks(compatible);
        setSelected(compatible[0]?.id ?? IGNORE_DECK);
      }
    });
  }, [open, formatId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const handleCreateDeck = () => {
    const name = newDeckName.trim();
    if (!name) return;
    setCreateError(null);
    setCreating(true);
    void (async () => {
      const res = await createDeckAction({ name, formatId, archetypeId: 'midrange' });
      setCreating(false);
      if ('error' in res) {
        setCreateError(res.error);
        return;
      }
      setDecks((prev) => [res.deck, ...prev]);
      setSelected(res.deck.id);
      setNewDeckName('');
    })();
  };

  if (!open || !mounted) return null;

  const deckIdToSubmit = selected === IGNORE_DECK ? '' : selected;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{ animation: 'ts-fade 0.2s ease-out' }}
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-seat-title"
        className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-[#0F172A] text-white shadow-[0_-16px_50px_rgba(0,0,0,0.6)] sm:max-h-[90vh] sm:rounded-[1.75rem] sm:shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        style={{ animation: 'ts-in 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <style>{`
          @keyframes ts-fade { from { opacity: 0 } to { opacity: 1 } }
          @keyframes ts-in {
            from { opacity: 0; transform: translateY(24px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#FF7300] to-orange-500" aria-hidden />

        <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-4">
          <div>
            <h2
              id="table-seat-title"
              className="font-display text-xl font-black uppercase tracking-wide text-white"
            >
              {mode === 'host' ? 'Il tuo tavolo' : 'Siediti al tavolo'}
            </h2>
            <p className="mt-0.5 text-xs font-medium text-white/55">{formatName} · Best of 3</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4 pt-1">
          {/* Sezione mazzo */}
          <section className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Mazzo {formatName}
            </p>

            <label
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition',
                selected === IGNORE_DECK
                  ? 'border-primary/60 bg-primary/[0.12]'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
              )}
            >
              <input
                type="radio"
                name="table-deck"
                checked={selected === IGNORE_DECK}
                onChange={() => setSelected(IGNORE_DECK)}
                className="sr-only"
              />
              <span
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                  selected === IGNORE_DECK ? 'border-primary bg-primary text-white' : 'border-white/25',
                )}
              >
                {selected === IGNORE_DECK && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-white">Ignora deck</span>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-white/40">
                veloce
              </span>
            </label>

            {loadingDecks && decks.length === 0 && (
              <p className="px-1 text-xs text-white/40">Carico i tuoi mazzi…</p>
            )}

            {decks.map((deck) => {
              const isSel = selected === deck.id;
              return (
                <label
                  key={deck.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition',
                    isSel
                      ? 'border-primary/60 bg-primary/[0.12]'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                  )}
                >
                  <input
                    type="radio"
                    name="table-deck"
                    checked={isSel}
                    onChange={() => setSelected(deck.id)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                      isSel ? 'border-primary bg-primary text-white' : 'border-white/25',
                    )}
                  >
                    {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                    {deck.name}
                  </span>
                </label>
              );
            })}

            {/* Crea mazzo al volo */}
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateDeck();
                  }
                }}
                placeholder="Nuovo mazzo…"
                maxLength={60}
                className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/35 focus:border-primary/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateDeck}
                disabled={creating || !newDeckName.trim()}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white/20 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Crea
              </button>
            </div>
            {createError && (
              <p role="alert" className="px-1 text-xs text-red-300">
                {createError}
              </p>
            )}
          </section>

          {/* Vista tavolo */}
          <section className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Al tavolo</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-900/20 to-black/30 p-3">
              <TableSide occupied username={myUsername} label="Tu" highlight />
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/70">
                  vs
                </span>
              </div>
              {opponentUsername ? (
                <TableSide occupied username={opponentUsername} label="Avversario" />
              ) : (
                <TableSide occupied={false} username="" label="Posto libero" />
              )}
            </div>
            {!opponentUsername && (
              <p className="text-center text-xs text-white/45">
                In attesa che qualcuno si sieda… oppure invita un amico.
              </p>
            )}
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.08] bg-black/25 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {mode === 'host' ? (
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onLeave}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-bold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                Alzati
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-50"
              >
                Resta seduto
              </button>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white/80 transition hover:bg-white/10 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => onConfirmJoin?.(deckIdToSubmit)}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {busy && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {busy ? 'Mi siedo…' : 'Siediti e gioca'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TableSide({
  occupied,
  username,
  label,
  highlight = false,
}: {
  occupied: boolean;
  username: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border p-3 text-center',
        occupied
          ? highlight
            ? 'border-primary/50 bg-primary/10'
            : 'border-white/15 bg-white/[0.05]'
          : 'border-dashed border-white/15 bg-white/[0.02]',
      )}
    >
      <span
        className={cn(
          'grid h-11 w-11 place-items-center rounded-full',
          occupied ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30',
        )}
      >
        {occupied ? <User className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
      </span>
      <span className="min-w-0 max-w-full truncate text-sm font-bold text-white">
        {occupied ? username : '—'}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</span>
    </div>
  );
}
