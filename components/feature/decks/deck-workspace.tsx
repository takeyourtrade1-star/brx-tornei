'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, SquareStack, type LucideIcon } from 'lucide-react';
import { MAX_DECKS_PER_USER } from '@/lib/deck-limits';
import type { CreateDeckInput } from '@/lib/validations/deck';
import { getUnlockedPlaymatId, type PlaymatId } from '@/lib/playmats';
import type { Deck } from '@/types/deck';
import { DeckBuilder } from './deck-builder';
import { DeckList } from './deck-list';
import { DeckPlaymatSettings } from './deck-playmat-settings';
import { ProxyInfoPopover } from './proxy-info-popover';
import { useServerDecks } from './use-server-decks';

interface DeckWorkspaceProps {
  initialDecks: Deck[];
  defaultPlaymatId?: PlaymatId;
  homeBackgroundEnabled?: boolean;
  qualifyingMatches?: number;
}
export function DeckWorkspace({
  initialDecks,
  defaultPlaymatId,
  homeBackgroundEnabled = false,
  qualifyingMatches = 0,
}: DeckWorkspaceProps) {
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [createAnother, setCreateAnother] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDeckIdRemap = useCallback((fromId: string, toId: string) => {
    setEditingDeckId((current) => (current === fromId ? toId : current));
  }, []);

  const workspace = useServerDecks(initialDecks, {
    onDeckIdRemap: handleDeckIdRemap,
  });
  const editingDeck = useMemo(
    () => (editingDeckId ? workspace.getDeck(editingDeckId) : undefined),
    [editingDeckId, workspace],
  );
  const inBuilder = view === 'builder' && editingDeck;
  const totalCards = useMemo(
    () => workspace.decks.reduce(
      (sum, deck) => sum + deck.main.reduce((count, card) => count + card.quantity, 0),
      0,
    ),
    [workspace.decks],
  );

  useEffect(() => {
    if (view === 'builder' && editingDeckId && !editingDeck) {
      setView('list');
      setEditingDeckId(null);
    }
  }, [editingDeck, editingDeckId, view]);

  const handleCreate = (input: CreateDeckInput) => {
    workspace.clearError();
    setSuccessMessage(null);
    setCreateAnother(false);
    const deck = workspace.createDeck(input);
    setEditingDeckId(deck.id);
    setView('builder');
  };

  const handleConfirm = async (deck: Deck) => {
    workspace.clearError();
    const result = await workspace.confirmDeck(deck.id);
    if ('error' in result) return;
    setSuccessMessage(`Mazzo “${deck.name}” salvato correttamente.`);
    setCreateAnother(workspace.decks.length < MAX_DECKS_PER_USER);
    setView('list');
    setEditingDeckId(null);
  };

  return (
    <div className="space-y-5">
      <header className="arena-panel z-20 !overflow-visible px-4 py-4 sm:px-5">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(440px_160px_at_10%_0%,rgba(255,115,0,0.11),transparent_70%)]"
        />
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              I miei mazzi
            </h1>
            <div className="mt-1">
              <ProxyInfoPopover />
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
            <div className="grid flex-1 grid-cols-2 divide-x divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 shadow-lg shadow-black/25 sm:flex-none">
              <WorkspaceMetric
                label="Mazzi"
                value={`${workspace.decks.length}/${MAX_DECKS_PER_USER}`}
                Icon={Layers}
                iconClassName="text-primary"
              />
              <WorkspaceMetric
                label="Carte"
                value={totalCards}
                Icon={SquareStack}
                iconClassName="text-marquee"
              />
            </div>

            {!inBuilder && defaultPlaymatId ? (
              <DeckPlaymatSettings
                initialPlaymatId={getUnlockedPlaymatId(defaultPlaymatId, qualifyingMatches)}
                initialHomeBackgroundEnabled={homeBackgroundEnabled}
                qualifyingMatches={qualifyingMatches}
              />
            ) : null}
          </div>
        </div>
      </header>

      {inBuilder ? (
        <div className="arena-panel p-4 sm:p-6">
          <DeckBuilder
            deck={editingDeck}
            onBack={() => {
              setView('list');
              setEditingDeckId(null);
            }}
            onAddCard={(card, section, quantity) =>
              workspace.addCard(editingDeck.id, card, section, quantity)}
            onUpdateQuantity={(blueprintId, section, quantity, maxQuantity) =>
              workspace.updateQuantity(editingDeck.id, blueprintId, section, quantity, maxQuantity)}
            onMoveCard={(blueprintId, from, to) =>
              workspace.moveCard(editingDeck.id, blueprintId, from, to)}
            onRemoveCard={(blueprintId, section) =>
              workspace.removeCard(editingDeck.id, blueprintId, section)}
            onSetCommander={(blueprintId) => workspace.setCommander(editingDeck.id, blueprintId)}
            onConfirmDeck={() => void handleConfirm(editingDeck)}
            confirming={workspace.isConfirming}
            saveError={workspace.error}
            onDeleteDeck={() => {
              workspace.deleteDeck(editingDeck.id);
              setView('list');
              setEditingDeckId(null);
            }}
            onDeckPatched={(deck) => workspace.setDeckState(
              workspace.decks.map((current) => current.id === deck.id ? deck : current),
            )}
          />
        </div>
      ) : (
        <DeckList
          decks={workspace.decks}
          onCreate={handleCreate}
          onEdit={(deckId) => {
            setEditingDeckId(deckId);
            setView('builder');
          }}
          onDelete={workspace.deleteDeck}
          isCreating={workspace.isPending}
          error={workspace.error}
          onClearError={workspace.clearError}
          successMessage={successMessage}
          onClearSuccess={() => setSuccessMessage(null)}
          autoCreate={createAnother}
          onAutoCreateConsumed={() => setCreateAnother(false)}
        />
      )}
    </div>
  );
}

function WorkspaceMetric({
  label,
  value,
  Icon,
  iconClassName,
}: {
  label: string;
  value: string | number;
  Icon?: LucideIcon;
  iconClassName?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2.5 py-2 sm:min-w-24">
      {Icon ? <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClassName}`} aria-hidden /> : null}
      <span className="min-w-0">
        <span className="block text-[7px] font-black uppercase tracking-[0.12em] text-white/35">{label}</span>
        <span className="block font-display text-sm font-black leading-none text-white">{value}</span>
      </span>
    </div>
  );
}
