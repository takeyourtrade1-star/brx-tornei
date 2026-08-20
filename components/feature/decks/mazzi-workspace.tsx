'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import type { SessionUser } from '@/types/auth';
import type { Deck } from '@/types/deck';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { PlaymatId } from '@/lib/playmats';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import { DeckBuilder } from './deck-builder';
import { DeckList } from './deck-list';
import { DeckPlaymatSettings } from './deck-playmat-settings';
import { useServerDecks } from './use-server-decks';

interface MazziWorkspaceProps {
  initialDecks: Deck[];
  user: SessionUser;
  /** Gamertag torneo-only mostrato nell'header al posto di email/username. */
  gamertag?: string;
  defaultPlaymatId: PlaymatId;
  reputation?: ReputationSummary | null;
}

export function MazziWorkspace({
  initialDecks,
  user,
  gamertag,
  defaultPlaymatId,
  reputation,
}: MazziWorkspaceProps) {
  const [deckView, setDeckView] = useState<'list' | 'builder'>('list');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);

  const handleDeckIdRemap = useCallback((fromId: string, toId: string) => {
    setEditingDeckId((current) => (current === fromId ? toId : current));
  }, []);

  const {
    decks,
    error,
    clearError,
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
    clearError();
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

  const inBuilder = deckView === 'builder' && editingDeck;

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} displayName={gamertag} reputation={reputation} />

      <div className="mx-auto w-full max-w-content px-4 py-6 sm:px-6">
        {!inBuilder && (
          <div className="mb-4">
            <Link
              href="/tornei"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/[0.08] bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm transition hover:border-slate-900/20 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Torna ai tornei
            </Link>
          </div>
        )}

        <header className="mb-5 rounded-2xl border border-slate-900/[0.08] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-7 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/[0.09] text-primary sm:h-14 sm:w-14">
              <Layers className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black tracking-tight text-header-bg sm:text-2xl">
                Crea mazzo
              </h1>
              <p className="mt-1 hidden max-w-2xl text-sm leading-relaxed text-slate-500 sm:block">
                Cerca le carte nel catalogo Ebartex, costruisci il mazzo per formato e verifica
                legalità, ban e limitazioni con Scryfall.
              </p>
            </div>
            <dl className="flex shrink-0 items-center divide-x divide-slate-900/[0.08]">
              <div className="px-3 text-center sm:px-5">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Mazzi</dt>
                <dd className="mt-0.5 text-lg font-black tabular-nums text-header-bg sm:text-2xl">
                  {decks.length}/3
                </dd>
              </div>
              <div className="px-3 text-center sm:px-5">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Carte totali</dt>
                <dd className="mt-0.5 text-lg font-black tabular-nums text-header-bg sm:text-2xl">
                  {totalCards}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        {!inBuilder && (
          <div className="mb-5">
            <DeckPlaymatSettings initialPlaymatId={defaultPlaymatId} />
          </div>
        )}

        <div className="rounded-2xl border border-slate-900/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-6">
          {inBuilder ? (
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
              error={error}
              onClearError={clearError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
