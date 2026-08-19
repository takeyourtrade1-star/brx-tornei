import { Flame, Info, Sparkles, Trophy } from 'lucide-react';
import { LEAGUES } from '@/lib/rank';

/**
 * Box informativo sul sistema delle 5 Leghe, reset 24h, streak a fuoco
 * e avviso del reset di lancio.
 */
export function RankLeagueInfo() {
  return (
    <section className="mt-5 rounded-2xl border-2 border-amber-500/35 bg-gradient-to-b from-amber-500/[0.08] via-amber-500/[0.02] to-white p-4 shadow-sm text-slate-700">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/20 text-amber-700 border border-amber-500/30">
            <Trophy className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-header-bg">
            Gradi & Leghe
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700">
          <Sparkles className="h-2.5 w-2.5" /> Beta Demo
        </span>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
        Le stelline riflettono la tua abilità e le vittorie conquistate nelle ultime{' '}
        <strong className="font-black text-header-bg">24 ore</strong>. Più vinci, più sali di lega:
      </p>

      {/* Elenco sintetico delle 5 Leghe */}
      <div className="mt-3 grid grid-cols-5 gap-1.5 text-center">
        {LEAGUES.map((l) => (
          <div
            key={l.stars}
            className="flex flex-col items-center rounded-xl border border-slate-300 bg-white p-2 shadow-sm"
          >
            <span className="text-xs font-black text-amber-500">
              {Array.from({ length: l.stars }).map(() => '★').join('')}
            </span>
            <span className="mt-1 text-[10px] font-black text-header-bg">{l.name}</span>
          </div>
        ))}
      </div>

      {/* Dettaglio ON FIRE e Reset */}
      <div className="mt-3.5 space-y-2 rounded-xl border border-slate-200 bg-slate-100/90 p-3 text-[11px] leading-snug text-slate-600">
        <div className="flex items-start gap-2">
          <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
          <p>
            <strong className="font-bold text-header-bg">Streak di Fuoco:</strong> con 3 o più
            vittorie consecutive, le tue stelle si accendono in modalità <span className="font-black text-orange-600">ON FIRE 🔥</span>.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
          <p className="text-slate-600">
            Le stelline si resettano ogni 24h. I dati attuali sono dimostrativi: al lancio ufficiale
            della piattaforma le stagioni e i gradi partiranno da zero.
          </p>
        </div>
      </div>
    </section>
  );
}
