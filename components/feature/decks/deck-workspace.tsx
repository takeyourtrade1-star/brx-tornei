'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, SquareStack } from 'lucide-react';
import { StatBadgeCard } from '@/components/feature/tornei/partite/stat-badge-card';
import { MAX_DECKS_PER_USER } from '@/lib/deck-limits';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { PlaymatId } from '@/lib/playmats';
import type { Deck } from '@/types/deck';
import { DeckBuilder } from './deck-builder';
import { DeckList } from './deck-list';
import { DeckPlaymatSettings } from './deck-playmat-settings';
import { useServerDecks } from './use-server-decks';

interface DeckWorkspaceProps {
  initialDecks: Deck[];
  defaultPlaymatId?: PlaymatId;
}
export function DeckWorkspace({
  initialDecks,
  defaultPlaymatId,
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
      <header className="arena-panel px-5 py-5 sm:px-7 sm:py-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_200px_at_15%_0%,rgba(255,115,0,0.12),transparent_70%)]"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="swords-emblem grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-global text-white shadow-lg sm:h-14 sm:w-14">
              <Layers className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                Arsenale ufficiale
              </p>
              <h1 className="font-display text-xl font-black tracking-tight text-white sm:text-2xl">
                I miei mazzi
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-white/55">
                Catalogo Ebartex, legalità, ban, copie e Commander sempre aggiornati.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:shrink-0">
            <StatBadgeCard
              label="Mazzi"
              value={`${workspace.decks.length}/${MAX_DECKS_PER_USER}`}
              Icon={Layers}
              iconColor="text-primary"
              bgGlow="rgba(255,115,0,0.22)"
              variant="compact"
              className="sm:w-[112px]"
            />
            <StatBadgeCard
              label="Carte"
              value={totalCards}
              Icon={SquareStack}
              iconColor="text-marquee"
              bgGlow="rgba(243,199,106,0.20)"
              variant="compact"
              className="sm:w-[112px]"
            />
          </div>
        </div>
      </header>

      {!inBuilder && defaultPlaymatId ? (
        <DeckPlaymatSettings initialPlaymatId={defaultPlaymatId} />
      ) : null}

      <div className="arena-panel p-4 sm:p-6">
        {inBuilder ? (
          <DeckBuilder
            deck={editingDeck}
            onBack={() => {
              setView('list');
              setEditingDeckId(null);
            }}
            onAddCard={(card, section) => workspace.addCard(editingDeck.id, card, section)}
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
    </div>
  );
}
