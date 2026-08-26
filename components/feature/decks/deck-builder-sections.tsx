'use client';

import { Crown } from 'lucide-react';
import { getMaxQuantityForDeckRow } from '@/lib/deck-copy-limits';
import { countCards, getMainDeckMinSize, getSideboardMaxSize } from '@/lib/data/deck-utils';
import { getCommanderCard } from '@/lib/deck-structure';
import type { CardCatalogHit } from '@/types/card';
import type { Deck, DeckCard as DeckCardType } from '@/types/deck';
import { DeckCard } from './deck-card';
import { DeckCardSearch } from './deck-card-search';

interface DeckBuilderSectionsProps {
  deck: Deck;
  onAddCard: (card: CardCatalogHit, section: 'main' | 'side') => void;
  onUpdateQuantity: (
    blueprintId: number,
    section: 'main' | 'side',
    quantity: number,
    maxQuantity: number,
  ) => void;
  onMoveCard: (blueprintId: number, from: 'main' | 'side', to: 'main' | 'side') => void;
  onRemoveCard: (blueprintId: number, section: 'main' | 'side') => void;
  onSetCommander: (blueprintId: number) => void;
}

export function DeckBuilderSections({
  deck,
  onAddCard,
  onUpdateQuantity,
  onMoveCard,
  onRemoveCard,
  onSetCommander,
}: DeckBuilderSectionsProps) {
  const commanderMode = deck.formatId === 'commander';
  const commander = commanderMode ? getCommanderCard(deck.main) : undefined;
  const mainCards = commanderMode
    ? deck.main.filter((card) => card.isCommander !== true)
    : deck.main;
  const mainCount = countCards(deck.main);
  const sideCount = countCards(deck.side);
  const target = getMainDeckMinSize(deck.formatId);
  const maxSide = getSideboardMaxSize(deck.formatId);
  const libraryTarget = commanderMode ? target - 1 : target;
  const libraryCount = commanderMode ? mainCount - (commander?.quantity ?? 0) : mainCount;

  return (
    <div className="grid min-h-[420px] grid-cols-1 gap-4 lg:min-h-[520px] lg:grid-cols-3">
      <SectionShell>
        <DeckCardSearch
          formatId={deck.formatId}
          main={deck.main}
          side={deck.side}
          sideCount={sideCount}
          onAddCard={onAddCard}
        />
      </SectionShell>

      <SectionShell>
        <SectionHeader
          title={commanderMode ? 'Grimorio' : 'Main deck'}
          count={`${libraryCount}/${libraryTarget}`}
          complete={libraryCount === libraryTarget}
        />
        <CardList
          cards={mainCards}
          empty="Cerca una carta e aggiungila al main deck"
          renderCard={(card) => {
            const blueprintId = Number(card.id);
            const max = getMaxQuantityForDeckRow(
              deck.formatId,
              card,
              deck.main,
              deck.side,
              'main',
            );
            return (
              <DeckCard
                key={blueprintId}
                card={card}
                maxQuantity={max}
                onChangeQuantity={(quantity) =>
                  onUpdateQuantity(blueprintId, 'main', quantity, max)
                }
                onMove={commanderMode ? undefined : () => onMoveCard(blueprintId, 'main', 'side')}
                onRemove={() => onRemoveCard(blueprintId, 'main')}
                moveLabel={commanderMode ? undefined : '→ Side'}
                commanderControl={commanderMode
                  ? { selected: false, onSelect: () => onSetCommander(blueprintId) }
                  : undefined}
              />
            );
          }}
        />
      </SectionShell>

      {commanderMode ? (
        <CommanderSlot
          commander={commander}
          onRemove={(blueprintId) => onRemoveCard(blueprintId, 'main')}
        />
      ) : (
        <SectionShell>
          <SectionHeader title="Sideboard" count={`${sideCount}/${maxSide}`} />
          <CardList
            cards={deck.side}
            empty="Aggiungi carte al sideboard dalla ricerca"
            renderCard={(card) => {
              const blueprintId = Number(card.id);
              const max = getMaxQuantityForDeckRow(
                deck.formatId,
                card,
                deck.main,
                deck.side,
                'side',
              );
              return (
                <DeckCard
                  key={blueprintId}
                  card={card}
                  maxQuantity={max}
                  onChangeQuantity={(quantity) =>
                    onUpdateQuantity(blueprintId, 'side', quantity, max)
                  }
                  onMove={() => onMoveCard(blueprintId, 'side', 'main')}
                  onRemove={() => onRemoveCard(blueprintId, 'side')}
                  moveLabel="→ Main"
                />
              );
            }}
          />
        </SectionShell>
      )}
    </div>
  );
}

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[280px] flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 lg:min-h-0">
      {children}
    </div>
  );
}

function SectionHeader({ title, count, complete = false }: {
  title: string;
  count: string;
  complete?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="font-display text-xs font-black uppercase tracking-wide text-white/80">{title}</p>
      <span className={complete ? 'text-[11px] font-bold text-emerald-300' : 'text-[11px] font-bold text-white/50'}>
        {count}
      </span>
    </div>
  );
}

function CardList({ cards, empty, renderCard }: {
  cards: DeckCardType[];
  empty: string;
  renderCard: (card: DeckCardType) => React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-col gap-2 overflow-auto pr-1">
      {cards.length === 0
        ? <p className="py-6 text-center text-xs text-white/40">{empty}</p>
        : cards.map(renderCard)}
    </div>
  );
}

function CommanderSlot({ commander, onRemove }: {
  commander?: DeckCardType;
  onRemove: (blueprintId: number) => void;
}) {
  return (
    <SectionShell>
      <SectionHeader title="Comandante" count={commander ? '1/1' : '0/1'} complete={Boolean(commander)} />
      <div className="mb-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-100/80">
        <Crown className="mb-2 h-5 w-5 text-emerald-300" aria-hidden />
        Scegli una carta singola dal grimorio. Il comandante conta nelle 100 carte totali.
      </div>
      {commander ? (
        <DeckCard
          card={commander}
          maxQuantity={1}
          onChangeQuantity={() => undefined}
          onRemove={() => onRemove(Number(commander.id))}
          commanderControl={{ selected: true, onSelect: () => undefined }}
        />
      ) : (
        <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-emerald-400/25 bg-black/10 px-5 text-center">
          <div>
            <Crown className="mx-auto h-9 w-9 text-emerald-300/60" aria-hidden />
            <p className="mt-3 text-sm font-black text-white">Nessun comandante</p>
            <p className="mt-1 text-xs text-white/45">Usa “Imposta” su una carta con quantità 1.</p>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
