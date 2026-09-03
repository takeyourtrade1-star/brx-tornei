'use client';

import { Crown, Library, Search, Sparkles } from 'lucide-react';
import { getMaxQuantityForDeckRow } from '@/lib/deck-copy-limits';
import { countCards, getMainDeckMinSize, getSideboardMaxSize } from '@/lib/data/deck-utils';
import { getCommanderCard } from '@/lib/deck-structure';
import type { CardCatalogHit } from '@/types/card';
import type { Deck, DeckCard as DeckCardType } from '@/types/deck';
import { DeckCard } from './deck-card';
import { DeckCardSearch } from './deck-card-search';

interface DeckBuilderSectionsProps {
  deck: Deck;
  onAddCard: (
    card: CardCatalogHit,
    section: 'main' | 'side',
    quantity?: number,
  ) => void;
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
    <div className="grid min-h-[520px] grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]">
      <SectionShell className="border-primary/20 bg-primary/[0.025] lg:max-h-[720px]">
        <div className="mb-3 flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <Search className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="font-display text-xs font-black uppercase tracking-wide text-white">
              Aggiungi carte
            </p>
            <p className="text-[10px] text-white/40">Cerca, aggiungi un playset o importa la lista</p>
          </div>
        </div>
        <DeckCardSearch
          formatId={deck.formatId}
          main={deck.main}
          side={deck.side}
          sideCount={sideCount}
          onAddCard={onAddCard}
        />
      </SectionShell>

      <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionShell className="lg:max-h-[720px]">
          <SectionHeader
            title={commanderMode ? 'Grimorio' : 'Main deck'}
            count={`${libraryCount}/${libraryTarget}`}
            complete={libraryCount === libraryTarget}
          />
          <CardList
            cards={mainCards}
            empty="Cerca una carta o importa la tua decklist"
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
          <SectionShell className="lg:max-h-[720px]">
            <SectionHeader title="Sideboard" count={`${sideCount}/${maxSide}`} />
            <CardList
              cards={deck.side}
              empty="Aggiungi le risposte per le partite successive"
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
    </div>
  );
}

function SectionShell({ children, className = '' }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 shadow-inner shadow-black/20 lg:min-h-0 ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({ title, count, complete = false }: {
  title: string;
  count: string;
  complete?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-3">
      <p className="flex items-center gap-2 font-display text-xs font-black uppercase tracking-wide text-white/85">
        <Library className="h-3.5 w-3.5 text-white/40" aria-hidden />
        {title}
      </p>
      <span className={complete ? 'rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-black text-emerald-300' : 'rounded-full bg-white/[0.07] px-2 py-1 text-[10px] font-black text-white/55'}>
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
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1">
      {cards.length === 0
        ? (
          <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center">
            <div>
              <Sparkles className="mx-auto h-6 w-6 text-primary/55" aria-hidden />
              <p className="mt-2 text-xs font-semibold leading-relaxed text-white/40">{empty}</p>
            </div>
          </div>
        )
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
