'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';
import { createDeckAction, listDecksAction } from '@/actions/decks';
import type { FormatId } from '@/lib/data/catalog';
import type { Deck } from '@/types/deck';
import { LobbyModalHeader } from './lobby-modal-header';
import { TableSeatBoard } from './table-seat-board';
import { TableSeatDeckSection } from './table-seat-deck-section';
import { useLobbyModal } from './use-lobby-modal';
import modalFont from '../tournament-modal-font.module.css';

interface TableSeatModalProps {
  open: boolean;
  mode: 'host' | 'join';
  formatId: FormatId;
  formatName: string;
  myUsername: string;
  opponentUsername?: string | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onLeave?: () => void;
  onConfirmJoin?: (deckId: string) => void;
}

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
  const [selected, setSelected] = useState(IGNORE_DECK);
  const [newDeckName, setNewDeckName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [loadingDecks, startLoad] = useTransition();
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open || mode === 'host') return;
    setCreateError(null);
    startLoad(async () => {
      const result = await listDecksAction();
      if ('decks' in result) {
        const compatible = result.decks.filter((deck) => deck.formatId === formatId);
        setDecks(compatible);
        setSelected(compatible[0]?.id ?? IGNORE_DECK);
      }
    });
  }, [open, mode, formatId]);

  useLobbyModal(open && mounted, dialogRef, onClose, busy);

  const handleCreateDeck = async () => {
    const name = newDeckName.trim();
    if (!name) return;
    setCreateError(null);
    setCreating(true);
    const result = await createDeckAction({ name, formatId, archetypeId: 'midrange' });
    setCreating(false);
    if ('error' in result) {
      setCreateError(result.error);
      return;
    }
    setDecks((current) => [result.deck, ...current]);
    setSelected(result.deck.id);
    setNewDeckName('');
  };

  if (!open || !mounted) return null;
  const deckIdToSubmit = selected === IGNORE_DECK ? '' : selected;
  const isHost = mode === 'host';

  return createPortal(
    <div
      data-lobby-modal-root="true"
      className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={busy}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-seat-title"
        aria-describedby="table-seat-description"
        className={`${modalFont.uiSans} relative flex max-h-[94vh] w-full max-w-xl animate-slide-up flex-col overflow-hidden rounded-t-[2rem] border border-slate-900/[0.08] bg-white text-header-bg shadow-[0_32px_80px_-24px_rgba(15,23,42,0.4)] sm:max-h-[90vh] sm:rounded-[2rem]`}
      >
        <div className="h-1 shrink-0 bg-gradient-to-r from-[#FF7300] to-[#e0564d]" aria-hidden="true" />
        <LobbyModalHeader
          eyebrow={isHost ? 'Tavolo creato' : 'Ultimo passaggio'}
          titleId="table-seat-title"
          descriptionId="table-seat-description"
          title={isHost ? 'Il tuo posto è pronto' : 'Siediti al tavolo'}
          description={isHost
            ? 'Controlla il tavolo e resta qui mentre aspetti il tuo avversario.'
            : 'Scegli il mazzo e controlla i posti prima di entrare.'}
          meta={[formatName, 'Best of 3', '2 giocatori']}
          onClose={onClose}
          closeDisabled={busy}
        />

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          {!isHost && (
            <TableSeatDeckSection
              formatName={formatName}
              decks={decks}
              selected={selected}
              ignoreDeckValue={IGNORE_DECK}
              loading={loadingDecks}
              newDeckName={newDeckName}
              creating={creating}
              createError={createError}
              onSelect={setSelected}
              onNameChange={setNewDeckName}
              onCreate={() => void handleCreateDeck()}
            />
          )}
          <TableSeatBoard
            myUsername={myUsername}
            opponentUsername={opponentUsername}
            eyebrow={isHost ? 'STATO POSTI' : 'PASSAGGIO 2'}
          />
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="shrink-0 border-t border-slate-900/[0.08] bg-slate-50/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {isHost ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onLeave}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/60 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Alzati
              </button>
              <PrimaryAction
                busy={busy}
                onClick={onClose}
                label="Torna alla lobby"
                busyLabel="Attendi…"
                initialFocus
              />
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-full border border-slate-900/15 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-header-bg disabled:opacity-50"
              >
                Annulla
              </button>
              <PrimaryAction
                busy={busy}
                onClick={() => onConfirmJoin?.(deckIdToSubmit)}
                label="Siediti e gioca"
                busyLabel="Mi siedo…"
              />
            </div>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function PrimaryAction({
  busy,
  onClick,
  label,
  busyLabel,
  initialFocus = false,
}: {
  busy: boolean;
  onClick: () => void;
  label: string;
  busyLabel: string;
  initialFocus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      data-modal-initial-focus={initialFocus ? 'true' : undefined}
      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-5 py-3 text-sm font-black text-white shadow-[0_8px_20px_-8px_rgba(255,115,0,0.45)] transition hover:opacity-95 disabled:opacity-50"
    >
      {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {busy ? busyLabel : label}
    </button>
  );
}
