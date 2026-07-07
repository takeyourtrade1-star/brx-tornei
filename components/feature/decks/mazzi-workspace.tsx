'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DeckBuilder } from '@/components/feature/decks/deck-builder';
import { DeckList } from '@/components/feature/decks/deck-list';
import { useServerDecks } from '@/components/feature/decks/use-server-decks';
import type { SessionUser } from '@/types/auth';
import type { Deck } from '@/types/deck';
import type { CreateDeckInput } from '@/lib/validations/deck';

interface MazziWorkspaceProps {
  initialDecks: Deck[];
  user: SessionUser;
}

export function MazziWorkspace({ initialDecks, user }: MazziWorkspaceProps) {
  const [deckView, setDeckView] = useState<'list' | 'builder'>('list');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);

  const handleDeckIdRemap = useCallback((fromId: string, toId: string) => {
    setEditingDeckId((current) => (current === fromId ? toId : current));
  }, []);

  const {
    decks,
    createDeck,
    deleteDeck,
    addCard,
    removeCard,
    updateQuantity,
    moveCard,
    getDeck,
    setDeckState,
    isPending,
  } = useServerDecks(initialDecks, { onDeckIdRemap: handleDeckIdRemap });

  const editingDeck = useMemo(
    () => (editingDeckId ? getDeck(editingDeckId) : undefined),
    [editingDeckId, getDeck]
  );

  const handleCreateDeck = (input: CreateDeckInput) => {
    const deck = createDeck(input);
    setEditingDeckId(deck.id);
    setDeckView('builder');
  };

  const handleDeckPatched = (deck: Deck) => {
    setDeckState(decks.map((d) => (d.id === deck.id ? deck : d)));
  };

  useEffect(() => {
    if (deckView === 'builder' && editingDeckId && !editingDeck) {
      setDeckView('list');
      setEditingDeckId(null);
    }
  }, [deckView, editingDeckId, editingDeck]);

  const totalCards = useMemo(
    () => decks.reduce((sum, d) => sum + d.main.reduce((s, c) => s + c.quantity, 0), 0),
    [decks]
  );

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} />

      <div className="mx-auto w-full max-w-content px-4 py-6 sm:px-6">
        <header className="relative mb-5 overflow-hidden rounded-2xl border border-white/10 bg-header-bg/95 p-3.5 text-white sm:p-6">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#FF7300]/15 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7300] to-[#e0564d] shadow-[0_6px_18px_rgba(255,115,0,0.3)] sm:h-14 sm:w-14 sm:rounded-2xl">
              <Layers className="h-5 w-5 text-white sm:h-7 sm:w-7" strokeWidth={2.2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-black uppercase tracking-wide text-white sm:text-3xl">
                Crea mazzo
              </h1>
              <p className="mt-1 hidden max-w-2xl text-sm leading-relaxed text-white/60 sm:block">
                Cerca le carte nel catalogo Ebartex, costruisci il mazzo per formato e verifica
                legalità, ban e limitazioni con Scryfall.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              <div className="rounded-xl border border-white/10 bg-black/20 px-2.5 py-1.5 text-center">
                <div className="font-display text-base font-black leading-none text-white">
                  {decks.length}
                </div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-white/40">
                  Mazzi
                </div>
              </div>
            </div>
          </div>

          <dl className="relative mt-5 hidden grid-cols-2 gap-3 sm:grid sm:max-w-md">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-white/40">Mazzi</dt>
              <dd className="mt-0.5 font-display text-xl font-black text-white">{decks.length}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                Carte totali
              </dt>
              <dd className="mt-0.5 font-display text-xl font-black text-white">{totalCards}</dd>
            </div>
          </dl>
        </header>

        <div className="rounded-2xl border border-white/10 bg-header-bg/95 p-4 text-white sm:p-6">
          {deckView === 'builder' && editingDeck ? (
            <DeckBuilder
              deck={editingDeck}
              onBack={() => {
                setDeckView('list');
                setEditingDeckId(null);
              }}
              onAddCard={(card, section) => addCard(editingDeck.id, card, section)}
              onUpdateQuantity={(bp, section, qty, max) =>
                updateQuantity(editingDeck.id, bp, section, qty, max)
              }
              onMoveCard={(bp, from, to) => moveCard(editingDeck.id, bp, from, to)}
              onRemoveCard={(bp, section) => removeCard(editingDeck.id, bp, section)}
              onDeleteDeck={() => {
                deleteDeck(editingDeck.id);
                setDeckView('list');
                setEditingDeckId(null);
              }}
              onDeckPatched={handleDeckPatched}
            />
          ) : (
            <DeckList
              decks={decks}
              onCreate={handleCreateDeck}
              onEdit={(id) => {
                setEditingDeckId(id);
                setDeckView('builder');
              }}
              onDelete={deleteDeck}
              isCreating={isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
