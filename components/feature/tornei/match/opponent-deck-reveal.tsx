import { CheckCircle2, Crown, Layers } from 'lucide-react';
import { getCardImageUrl } from '@/lib/assets';
import type { DeckCard } from '@/types/deck';
import type { Participant } from '@/types/tournament';

export function OpponentDeckReveal({ opponent, formatName }: {
  opponent: Participant;
  formatName: string;
}) {
  const deck = opponent.deck;
  if (!deck) return null;

  const main = [...(deck.main ?? [])].sort((a, b) => {
    if (a.isCommander !== b.isCommander) return a.isCommander ? -1 : 1;
    return a.name.localeCompare(b.name, 'it');
  });
  const side = deck.side ?? [];
  const total = [...main, ...side].reduce((sum, card) => sum + card.quantity, 0);

  return (
    <section className="pt-row-in mx-auto mt-5 w-full max-w-3xl overflow-hidden rounded-3xl border border-sky-400/25 bg-header-bg/95 text-left shadow-2xl shadow-black/45 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-400/25 bg-sky-500/10 text-sky-300">
          <Layers className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-sky-300/80">
            Mazzo di {opponent.username}
          </p>
          <h3 className="truncate font-display text-base font-black text-white">{deck.name}</h3>
          <p className="text-xs font-semibold text-white/45">
            {formatName}{deck.archetype ? ` · ${deck.archetype}` : ''}{total > 0 ? ` · ${total} carte` : ''}
          </p>
        </div>
        {deck.verified && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verificato
          </span>
        )}
      </div>

      {main.length > 0 || side.length > 0 ? (
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)]">
          <DeckCardGroup title="Main deck" cards={main} />
          <DeckCardGroup title="Sideboard" cards={side} empty="Nessuna carta" />
        </div>
      ) : (
        <p className="px-5 py-6 text-center text-xs font-semibold text-white/45">
          La lista delle carte non è disponibile per questa partita.
        </p>
      )}
    </section>
  );
}

function DeckCardGroup({ title, cards, empty = 'Nessuna carta dichiarata' }: {
  title: string;
  cards: DeckCard[];
  empty?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">{title}</h4>
        <span className="text-[10px] font-bold text-white/35">
          {cards.reduce((sum, card) => sum + card.quantity, 0)}
        </span>
      </div>
      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-white/35">{empty}</p>
      ) : (
        <ul className="grid max-h-72 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
          {cards.map((card) => {
            const image = getCardImageUrl(card.image);
            return (
              <li key={`${card.id}-${card.isCommander ? 'commander' : 'main'}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5">
                <span className="h-11 w-8 shrink-0 overflow-hidden rounded bg-white/10">
                  {image ? (
                    // URL dinamico del catalogo: resta coerente con le altre card del builder.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-white">{card.name}</span>
                  {card.isCommander && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-300">
                      <Crown className="h-2.5 w-2.5" /> Comandante
                    </span>
                  )}
                </span>
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-black text-white/70">×{card.quantity}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
