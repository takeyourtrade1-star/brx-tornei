'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers, SquareStack } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatBadgeCard } from '@/components/feature/tornei/partite/stat-badge-card';
import type { SessionUser } from '@/types/auth';
import type { Deck } from '@/types/deck';
import type { CreateDeckInput } from '@/lib/validations/deck';
import type { PlaymatId } from '@/lib/playmats';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import type { NotificationSnapshot } from '@/types/notification';
import { MAX_DECKS_PER_USER } from '@/lib/deck-limits';
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
  initialNotifications: NotificationSnapshot;
}

export function MazziWorkspace({
  initialDecks,
  user,
  gamertag,
  defaultPlaymatId,
  reputation,
  initialNotifications,
}: MazziWorkspaceProps) {
  const [deckView, setDeckView] = useState<'list' | 'builder'>('list');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [createAnother, setCreateAnother] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setCommander,
    confirmDeck,
    getDeck,
    setDeckState,
    isPending,
    isConfirming,
  } = useServerDecks(initialDecks, { onDeckIdRemap: handleDeckIdRemap });

  const editingDeck = useMemo(
    () => (editingDeckId ? getDeck(editingDeckId) : undefined),
    [editingDeckId, getDeck]
  );

  const handleCreateDeck = (input: CreateDeckInput) => {
    clearError();
    setSuccessMessage(null);
    setCreateAnother(false);
    const deck = createDeck(input);
    setEditingDeckId(deck.id);
    setDeckView('builder');
  };

  const handleConfirmDeck = async (deck: Deck) => {
    clearError();
    const result = await confirmDeck(deck.id);
    if ('error' in result) return;
    setSuccessMessage(`Mazzo “${deck.name}” salvato correttamente.`);
    setCreateAnother(decks.length < MAX_DECKS_PER_USER);
    setDeckView('list');
    setEditingDeckId(null);
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
    <div className="relative min-h-screen">
      <DashboardHeader
        user={user}
        displayName={gamertag}
        reputation={reputation}
        initialNotifications={initialNotifications}
      />

      <div className="mx-auto w-full max-w-content px-4 py-5 sm:px-6 sm:py-6">
        {!inBuilder && (
          <div className="mb-4">
            <Link href="/tornei" className="arena-back">
              <ArrowLeft className="h-3.5 w-3.5" />
              Torna ai tornei
            </Link>
          </div>
        )}

        <header className="arena-panel mb-5 px-5 py-5 sm:px-7 sm:py-6">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_200px_at_15%_0%,rgba(255,115,0,0.12),transparent_70%)]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-marquee/40 to-transparent"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <span className="swords-emblem relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#FF7300] to-[#e0564d] text-white shadow-lg shadow-orange-950/50 sm:h-14 sm:w-14">
                <Layers className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Arsenale</p>
                <h1 className="font-display text-xl font-black tracking-tight text-white sm:text-2xl">
                  I miei mazzi
                </h1>
                <p className="mt-1 hidden max-w-xl text-sm leading-relaxed text-white/55 sm:block">
                  Costruisci i mazzi dal catalogo Ebartex e verifica legalità, ban e copie.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:w-auto sm:shrink-0">
              <StatBadgeCard
                label="Mazzi"
                value={`${decks.length}/${MAX_DECKS_PER_USER}`}
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

        {!inBuilder && (
          <div className="mb-5">
            <DeckPlaymatSettings initialPlaymatId={defaultPlaymatId} />
          </div>
        )}

        <div className="arena-panel p-4 sm:p-6">
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
              onSetCommander={(bp) => setCommander(editingDeck.id, bp)}
              onConfirmDeck={() => void handleConfirmDeck(editingDeck)}
              confirming={isConfirming}
              saveError={error}
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
              successMessage={successMessage}
              onClearSuccess={() => setSuccessMessage(null)}
              autoCreate={createAnother}
              onAutoCreateConsumed={() => setCreateAnother(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
