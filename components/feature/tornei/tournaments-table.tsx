import type { BestOf, Tournament } from '@/types/tournament';
import { StatusBadge } from './status-badge';
import { Eye, Lock, Plus, UserPlus } from 'lucide-react';

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

/**
 * Tabella tornei (dal mockup): Buy-In · Forma · Stato · Registrati · Partecipanti.
 * Server component in pannello glass Ebartex; i dati arrivano già pronti dalla pagina.
 */
export function TournamentsTable({ tournaments }: { tournaments: Tournament[] }) {
  if (tournaments.length === 0) {
    return (
      <div className="brx-glass rounded-3xl border border-white/15 p-12 text-center">
        <p className="font-sans text-xl font-bold uppercase tracking-wide text-white/80">
          Nessun torneo per questa selezione
        </p>
        <p className="mt-2 text-sm text-white/55">Creane uno con “Crea Torneo”.</p>
      </div>
    );
  }

  return (
    <>
      {/* MOBILE VIEW (Card List) */}
      <div className="flex md:hidden flex-col gap-4">
        {tournaments.map((t) => {
          const joinedCount = t.participants.length;
          const isFull = joinedCount >= t.maxPlayers;
          
          return (
            <div key={t.id} className="brx-glass rounded-2xl border border-white/15 p-4 flex flex-col gap-4 font-sans text-white relative overflow-visible">
              {/* Top Row: Buy-In and Status */}
              <div className="flex items-center justify-between">
                <span className="bg-[#FF7300]/10 border border-[#FF7300]/30 text-[#FF7300] px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
                  For Fun
                </span>
                
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  {t.status === 'iniziata' && (
                    <div className="relative group cursor-pointer shrink-0">
                      <button 
                        type="button" 
                        aria-label="Guarda partita live" 
                        className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 active:scale-95 transition-all"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 z-30 hidden group-hover:block">
                        <div className="animate-auth-enter">
                          <div className="bg-slate-950/95 backdrop-blur-md rounded-lg border border-white/20 px-2 py-1 text-center shadow-xl">
                            <span className="text-[10px] font-bold text-white whitespace-nowrap">Guarda partita live</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-950/95 border-r border-b border-white/20 rotate-45 mx-auto -mt-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Row: Game Details */}
              <div className="grid grid-cols-2 gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/5 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Formato</span>
                  <span className="font-extrabold text-white">BO{BEST_OF_LABEL[t.bestOf] === '1' ? '1' : BEST_OF_LABEL[t.bestOf] === '2/3' ? '3' : '5'}</span>
                </div>
                
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Registrati</span>
                  <span className="font-extrabold text-white flex items-center gap-1">
                    {joinedCount}/{t.maxPlayers}
                    {t.isPrivate && <Lock className="h-3.5 w-3.5 text-amber-500 inline shrink-0" />}
                  </span>
                </div>
              </div>

              {/* Participants Section */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold px-1">Partecipanti</span>
                {joinedCount === 0 && t.status !== 'in_registrazione' ? (
                  <span className="text-xs text-white/40 italic px-1">—</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {t.participants.map((p) => {
                      const { country, deck } = getMockParticipantDetails(p.username, t.format);
                      return (
                        <div
                          key={p.id}
                          className="relative group flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/15 text-xs text-white/85 cursor-help"
                        >
                          <span>{country.flag}</span>
                          <span className="font-bold">{p.username}</span>
                          <span className="text-[10px] text-white/40 max-w-[80px] truncate font-mono">({deck})</span>

                          {/* Tooltip on tap/hover for mobile details */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-48 z-30 hidden group-hover:block">
                            <div className="animate-auth-enter">
                              <div className="bg-slate-950/95 backdrop-blur-md rounded-2xl border border-white/20 p-3 shadow-2xl text-left">
                                <div className="flex flex-col gap-1.5 font-sans">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-1">
                                    <span className="text-xs font-bold text-white truncate max-w-[100px]">{p.username}</span>
                                    <span className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-white/80 font-bold text-[10px] shrink-0">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                                        alt={country.code}
                                        className="w-3.5 h-2.5 object-cover rounded-sm border border-white/10 shrink-0"
                                      />
                                      {country.code}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-white/70">
                                    <div className="flex items-center justify-between">
                                      <span>Paese:</span>
                                      <span className="text-white font-semibold">{country.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                      <span>Stato:</span>
                                      <span className="text-emerald-400 font-bold">Online</span>
                                    </div>
                                    <div className="mt-1.5 border-t border-white/5 pt-1">
                                      <span className="text-white/50 block text-[9px] uppercase tracking-wider">Mazzo in uso</span>
                                      <span className="text-marquee font-bold block truncate mt-0.5 text-xs">{deck}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="w-2.5 h-2.5 bg-slate-950/95 border-r border-b border-white/20 rotate-45 mx-auto -mt-1.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {t.status === 'in_registrazione' && !isFull && (
                      <div>
                        {t.isPrivate ? (
                          <button className="brx-liquid-glass-btn flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold text-white transition-all shadow-md active:scale-95">
                            <UserPlus className="h-3.5 w-3.5 shrink-0" />
                            Chiedi di partecipare
                          </button>
                        ) : (
                          <button className="brx-liquid-glass-btn flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold text-white transition-all shadow-md active:scale-95">
                            <Plus className="h-3.5 w-3.5 shrink-0" />
                            Partecipa
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW (Table) */}
      <div className="hidden md:block brx-glass overflow-x-auto md:overflow-visible rounded-3xl border border-white/15">
        <table className="w-full min-w-[680px] text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/15 font-sans text-xs font-bold uppercase tracking-widest text-marquee">
              <th scope="col" className="px-5 py-4">Buy-In</th>
              <th scope="col" className="px-5 py-4">Forma</th>
              <th scope="col" className="px-5 py-4">Stato</th>
              <th scope="col" className="px-5 py-4">Registrati</th>
              <th scope="col" className="px-5 py-4">Partecipanti</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => {
              return (
                <tr
                  key={t.id}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.06]"
                >
                  <td className="px-5 py-4">
                    <span className="font-sans text-sm font-bold uppercase tracking-wide text-marquee">
                      For Fun
                    </span>
                  </td>
                  <td className="px-5 py-4 font-sans text-lg font-bold text-white/90">
                    {BEST_OF_LABEL[t.bestOf]}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.status} />
                      {t.status === 'iniziata' && (
                        <div className="relative group cursor-pointer shrink-0">
                          <Eye className="h-4 w-4 text-white/70 hover:text-white transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 z-30 hidden group-hover:block">
                            <div className="animate-auth-enter">
                              <div className="bg-slate-950/95 backdrop-blur-md rounded-lg border border-white/20 px-2 py-1 text-center shadow-xl">
                                <span className="text-[10px] font-bold text-white whitespace-nowrap">Guarda partita live</span>
                              </div>
                              <div className="w-1.5 h-1.5 bg-slate-950/95 border-r border-b border-white/20 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-sans text-lg font-bold tabular-nums text-white/90 overflow-visible">
                    <div className="flex items-center gap-1.5">
                      <span>{t.participants.length}/{t.maxPlayers}</span>
                      {t.isPrivate && (
                        <div className="relative group cursor-help shrink-0 ml-auto">
                          <Lock className="h-4 w-4 text-amber-500" />
                          
                          {/* Tooltip Partita Privata */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-28 z-30 hidden group-hover:block">
                            <div className="animate-auth-enter">
                              <div className="bg-slate-950/95 backdrop-blur-md rounded-lg border border-white/20 px-2 py-1 text-center shadow-xl">
                                <span className="text-[10px] font-bold text-white whitespace-nowrap">Partita privata</span>
                              </div>
                              <div className="w-1.5 h-1.5 bg-slate-950/95 border-r border-b border-white/20 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 overflow-visible">
                    {t.participants.length === 0 && t.status !== 'in_registrazione' ? (
                      <span className="text-white/35">—</span>
                    ) : (
                      <ul className="flex flex-wrap gap-2 items-center">
                        {t.participants.map((p) => {
                          const { country, deck } = getMockParticipantDetails(p.username, t.format);
                          return (
                            <li
                              key={p.id}
                              className="relative group flex items-center rounded-full bg-white/10 px-2.5 py-0.5 ring-1 ring-white/15 cursor-help"
                            >
                              <span className="text-xs font-semibold text-white/85">{p.username}</span>
  
                              {/* Pop-up mockup (Liquid Glass Card) */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-48 z-30 hidden group-hover:block">
                                <div className="animate-auth-enter">
                                  <div className="bg-slate-950/95 backdrop-blur-md rounded-2xl border border-white/20 p-3 shadow-2xl text-left">
                                  <div className="flex flex-col gap-1.5 font-sans">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-1">
                                      <span className="text-xs font-bold text-white truncate max-w-[100px]">{p.username}</span>
                                      <span className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-white/80 font-bold text-[10px] shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                                          alt={country.code}
                                          className="w-3.5 h-2.5 object-cover rounded-sm border border-white/10 shrink-0"
                                        />
                                        {country.code}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-white/70">
                                      <div className="flex items-center justify-between">
                                        <span>Paese:</span>
                                        <span className="text-white font-semibold">{country.name}</span>
                                      </div>
                                      <div className="flex items-center justify-between mt-0.5">
                                        <span>Stato:</span>
                                        <span className="text-emerald-400 font-bold">Online</span>
                                      </div>
                                      <div className="mt-1.5 border-t border-white/5 pt-1">
                                        <span className="text-white/50 block text-[9px] uppercase tracking-wider">Mazzo in uso</span>
                                        <span className="text-marquee font-bold block truncate mt-0.5 text-xs">{deck}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="w-2.5 h-2.5 bg-slate-950/95 border-r border-b border-white/20 rotate-45 mx-auto -mt-1.5" />
                              </div>
                            </div>
                            </li>
                          );
                        })}
                        {t.status === 'in_registrazione' && (
                          <li>
                            {t.isPrivate ? (
                              <button className="brx-liquid-glass-btn flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold text-white transition-all hover:scale-105 shadow-md">
                                <UserPlus className="h-3.5 w-3.5 shrink-0" />
                                Chiedi di partecipare
                              </button>
                            ) : (
                              <button className="brx-liquid-glass-btn flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold text-white transition-all hover:scale-105 shadow-md">
                                <Plus className="h-3.5 w-3.5 shrink-0" />
                                Partecipa
                              </button>
                            )}
                          </li>
                        )}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
