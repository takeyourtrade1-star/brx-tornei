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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-seat-title"
        aria-describedby="table-seat-description"
        className={`${modalFont.uiSans} simple-panel-solid relative flex max-h-[94vh] w-full max-w-xl animate-slide-up flex-col overflow-hidden rounded-b-none sm:max-h-[90vh] sm:rounded-3xl`}
      >
        <div className="h-1 shrink-0 bg-gradient-to-r from-primary to-orange-500" aria-hidden="true" />
        <LobbyModalHeader
          eyebrow={isHost ? 'Tavolo creato' : 'Ultimo passaggio'}
          titleId="table-seat-title"
          descriptionId="table-seat-description"
          title={isHost ? 'Il tuo posto è pronto' : 'Siediti al tavolo'}
          description={`${formatName} · Best of 3 · 2 giocatori`}
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
            eyebrow={isHost ? 'Il tuo tavolo' : 'Passaggio 2'}
          />
          {error && (
            <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/15 px-3 py-2.5 text-sm font-semibold text-white">
              {error}
            </p>
          )}
        </div>

        <footer className="shrink-0 border-t border-white/10 bg-black/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {isHost ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onLeave}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-destructive/25 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Alzati
              </button>
              <PrimaryAction
                busy={busy}
                onClick={onClose}
                label="Siediti"
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
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
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
      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50"
    >
      {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {busy ? busyLabel : label}
    </button>
  );
}
