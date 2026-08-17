'use client';

import { Coins, Swords, UserPlus, Users } from 'lucide-react';
import { getBuyInLabel } from '@/lib/data/buy-in';
import type { BestOf } from '@/types/tournament';
import type { LobbyTable } from '@/lib/lobby';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyTableCardProps {
  table: LobbyTable;
  busy?: boolean;
  createLocked?: boolean;
  onSit: (table: LobbyTable) => void;
}

/**
 * Tavolo Libero: banner orizzontale compatto (metà altezza), visivamente distinto
 * dai tavoli con partite aperte o in corso, mantenendo tutti i contenuti invariati.
 */
export function EmptyTableCard({ table, busy, createLocked = false, onSit }: EmptyTableCardProps) {
  const price = getBuyInLabel(table.tournament?.buyIn ?? 'for_fun');
  const bestOf: BestOf = table.tournament?.bestOf ?? 'BO3';

  if (createLocked) {
    return (
      <p
        role="note"
        className="rounded-2xl border-2 border-dashed border-white/25 bg-white/10 px-4 py-3 text-sm font-bold text-white/85 backdrop-blur-sm"
      >
        Aggiungiti a un tavolo già aperto, oppure scegli un formato in alto per aprirne uno nuovo.
      </p>
    );
  }

  const handleSit = () => {
    if (!busy) onSit(table);
  };

  return (
    <div
      className={cn(
        'table-empty-glow group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/40 p-3 sm:px-4 sm:py-3 text-left shadow-sm transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary hover:from-orange-50 hover:to-amber-50 hover:shadow-md hover:shadow-primary/15 active:translate-y-0',
      )}
    >
      {/* Blocco Sinistro: Icona slot + Titolo + Badge Libero */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-dashed border-primary/40 bg-white shadow-xs text-primary group-hover:scale-105 transition-transform">
          <UserPlus className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              Nuovo tavolo
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-emerald-700">
              Libero
            </span>
          </div>
          <h3 className="truncate text-sm font-black text-slate-800 sm:text-base">
            Tavolo libero
          </h3>
        </div>
      </div>

      {/* Blocco Centrale: Arena Posti Compatta (G1 vs G2) */}
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300/80 bg-white/90 px-3 py-1.5 shadow-xs">
        <span className="text-[10px] font-bold text-slate-400">G1: Libero</span>
        <span className="text-[9px] font-black uppercase text-amber-500">vs</span>
        <span className="text-[10px] font-bold text-slate-400">G2: Libero</span>
      </div>

      {/* Blocco Destro: Chip Dettagli + Bottone Siediti */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
        <div className="flex items-center gap-1 text-[10px] font-bold">
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-slate-700 shadow-2xs">
            <Users className="h-3 w-3 text-blue-600 shrink-0" aria-hidden />
            <span>0/2</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-slate-700 shadow-2xs">
            <Swords className="h-3 w-3 text-amber-600 shrink-0" aria-hidden />
            <span>{bestOf}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 uppercase text-slate-700 shadow-2xs">
            <Coins className="h-3 w-3 text-emerald-600 shrink-0" aria-hidden />
            <span>{price}</span>
          </span>
        </div>

        <Button
          type="button"
          disabled={busy}
          onClick={handleSit}
          className="h-8 gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-3.5 text-xs font-black text-white shadow-xs hover:shadow-sm hover:brightness-105 active:scale-95 transition-all"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden />
          <span>SIEDITI</span>
        </Button>
      </div>
    </div>
  );
}
