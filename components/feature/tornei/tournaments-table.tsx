import type { BestOf, Tournament } from '@/types/tournament';
import { getBuyInLabel } from '@/lib/data/buy-in';
import { StatusBadge } from './status-badge';
import { MobileJoinButton } from './mobile-join-button';
import { Eye, Lock, Plus, UserPlus } from 'lucide-react';
import {
  tournamentActionButtonClass,
  tournamentActionIconClass,
} from './tournament-action-button-styles';

/** "Forma" dal mockup: best-of mostrato come frazione (2/3, 3/5). */
const BEST_OF_LABEL: Record<BestOf, string> = {
  BO1: '1',
  BO3: '2/3',
  BO5: '3/5',
};

/** Genera dettagli mockup realistici e stabili basati su username e formato del torneo. */
function getMockParticipantDetails(username: string, format: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash);

  const countries = [
    { code: 'IT', flag: '🇮🇹', name: 'Italia' },
    { code: 'US', flag: '🇺🇸', name: 'Stati Uniti' },
    { code: 'DE', flag: '🇩🇪', name: 'Germania' },
    { code: 'FR', flag: '🇫🇷', name: 'Francia' },
    { code: 'ES', flag: '🇪🇸', name: 'Spagna' },
    { code: 'GB', flag: '🇬🇧', name: 'Regno Unito' },
  ];
  const country = countries[index % countries.length]!;

  const decksPerFormat: Record<string, string[]> = {
    'old-school': ['The Deck', 'Mono Black Control', 'Erhnam Geddon', 'Atog Burn'],
    premodern: ['Elves', 'Goblins', 'Replenish', 'Landstill', 'Trix'],
    pioneer: ['Rakdos Midrange', 'Mono White Humans', 'Lotus Field Combo', 'Azorius Control'],
    modern: ['Izzet Murktide', 'Temur Rhinos', 'Amulet Titan', 'Mono Black Coffers'],
    standard: ['Esper Midrange', 'Red Deck Wins', 'Domain Control', 'Golgari Midrange'],
    legacy: ['Delver of Secrets', 'Reanimator', 'Death and Taxes', 'Initiative Stompy'],
    commander: ["Atraxa, Praetors' Voice", 'Urza, Lord High Artificer', 'Krenko, Mob Boss', 'Kenrith, the Returned King'],
  };

  const decks = decksPerFormat[format] || ['Mono Red Burn', 'Blue-White Control', 'Green Stompy'];
  const deck = decks[index % decks.length]!;

  return { country, deck };
}

interface TournamentsTableProps {
  tournaments: Tournament[];
  formatName?: string;
  modeName?: string;
  filtersActive?: boolean;
}

/**
 * Tabella tornei: Buy-In · Forma · Stato · Registrati · Partecipanti.
 */
export function TournamentsTable({
  tournaments,
  formatName,
  modeName,
  filtersActive = false,
}: TournamentsTableProps) {
  if (tournaments.length === 0) {
    const contextLabel =
      formatName && modeName ? `${formatName} · ${modeName}` : 'questa selezione';

    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center sm:rounded-3xl">
        <p className="font-sans text-lg font-bold uppercase tracking-wide text-white/75 sm:text-xl">
          Nessun torneo per {contextLabel}
        </p>
        <p className="mt-2 text-sm text-white/45">
          {filtersActive
            ? 'Prova ad allargare i filtri o creane uno con “Crea Torneo”.'
            : 'Creane uno con “Crea Torneo”.'}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* MOBILE VIEW (Card List) */}
      <div className="flex flex-col gap-3 md:hidden">
        {tournaments.map((t) => {
          const joinedCount = t.participants.length;
          const isFull = joinedCount >= t.maxPlayers;

          return (
            <div
              key={t.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-sans text-white"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-marquee ring-1 ring-primary/25">
                  {getBuyInLabel(t.buyIn)}
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  {t.status === 'iniziata' && (
                    <button
                      type="button"
                      aria-label="Guarda partita live"
                      className="rounded-full p-1.5 text-white/60 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Forma
                  </span>
                  <p className="mt-0.5 font-bold tabular-nums text-white">{BEST_OF_LABEL[t.bestOf]}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Registrati
                  </span>
                  <p className="mt-0.5 flex items-center gap-1 font-bold tabular-nums text-white">
                    {joinedCount}/{t.maxPlayers}
                    {t.isPrivate && <Lock className="h-3.5 w-3.5 text-amber-500" />}
                  </p>
                </div>
              </div>

              {joinedCount === 0 && t.status !== 'in_registrazione' ? (
                <span className="text-xs text-white/35">Nessun partecipante</span>
              ) : (
                <div className="flex flex-wrap gap-1.5 border-t border-white/8 pt-3">
                  {t.participants.map((p) => {
                    const { country, deck } = getMockParticipantDetails(p.username, t.format);
                    return (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-xs text-white/80 ring-1 ring-white/10"
                      >
                        <span>{country.flag}</span>
                        <span className="font-semibold">{p.username}</span>
                        <span className="max-w-[72px] truncate text-[10px] text-white/40">{deck}</span>
                      </span>
                    );
                  })}
                  {t.status === 'in_registrazione' && !isFull && (
                    <MobileJoinButton isPrivate={t.isPrivate} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW (Table) */}
      <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] md:block">
        <table className="w-full min-w-[640px] text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/8 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
              <th scope="col" className="px-4 py-3">Buy-In</th>
              <th scope="col" className="px-4 py-3">Forma</th>
              <th scope="col" className="px-4 py-3">Stato</th>
              <th scope="col" className="px-4 py-3">Registrati</th>
              <th scope="col" className="px-4 py-3">Partecipanti</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr
                key={t.id}
                className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.04]"
              >
                <td className="px-4 py-3">
                  <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-marquee ring-1 ring-primary/20">
                    {getBuyInLabel(t.buyIn)}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold tabular-nums text-white/90">
                  {BEST_OF_LABEL[t.bestOf]}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                    {t.status === 'iniziata' && (
                      <Eye className="h-3.5 w-3.5 text-white/50" aria-hidden />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-bold tabular-nums text-white/90">
                  <span className="inline-flex items-center gap-1.5">
                    {t.participants.length}/{t.maxPlayers}
                    {t.isPrivate && (
                      <Lock className="h-3.5 w-3.5 text-amber-500" aria-label="Partita privata" />
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t.participants.length === 0 && t.status !== 'in_registrazione' ? (
                    <span className="text-white/30">—</span>
                  ) : (
                    <ul className="flex flex-wrap items-center gap-1.5">
                      {t.participants.map((p) => {
                        const { country, deck } = getMockParticipantDetails(p.username, t.format);
                        return (
                          <li
                            key={p.id}
                            className="group relative flex items-center rounded-full bg-white/8 px-2 py-0.5 ring-1 ring-white/10"
                          >
                            <span className="text-xs font-semibold text-white/85">{p.username}</span>
                            <div className="absolute bottom-full left-1/2 z-30 mb-2 hidden w-44 -translate-x-1/2 group-hover:block">
                              <div className="rounded-xl border border-white/15 bg-slate-950/95 p-2.5 text-left shadow-xl backdrop-blur-md">
                                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                                  <span className="truncate text-xs font-bold">{p.username}</span>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                                    alt={country.code}
                                    className="h-2.5 w-3.5 rounded-sm border border-white/10 object-cover"
                                  />
                                </div>
                                <p className="mt-1 text-[10px] text-white/55">{country.name}</p>
                                <p className="mt-1 truncate text-xs font-bold text-marquee">{deck}</p>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                      {t.status === 'in_registrazione' && (
                        <li>
                          {t.isPrivate ? (
                            <button
                              type="button"
                              className={tournamentActionButtonClass('sm')}
                            >
                              <UserPlus className={tournamentActionIconClass} />
                              Chiedi
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={tournamentActionButtonClass('sm')}
                            >
                              <Plus className={tournamentActionIconClass} />
                              Partecipa
                            </button>
                          )}
                        </li>
                      )}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
