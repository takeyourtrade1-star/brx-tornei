'use client';

import { UserPlus } from 'lucide-react';
import { getBuyInLabel } from '@/lib/data/buy-in';
import type { BestOf } from '@/types/tournament';
import type { LobbyTable } from '@/lib/lobby';
import { Button } from '@/components/ui/button';
import { TableMetaChips } from './table-meta-chips';
import { TableStage } from './table-stage';

interface EmptyTableCardProps {
  table: LobbyTable;
  busy?: boolean;
  createLocked?: boolean;
  onSit: (table: LobbyTable) => void;
}

/** Tavolo libero: feltro 3D tratteggiato che invita a sedersi. */
export function EmptyTableCard({ table, busy, createLocked = false, onSit }: EmptyTableCardProps) {
  const price = getBuyInLabel(table.tournament?.buyIn ?? 'for_fun');
  const bestOf: BestOf = table.tournament?.bestOf ?? 'BO3';

  if (createLocked) {
    return (
      <p
        role="note"
        className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 backdrop-blur-sm"
      >
        Aggiungiti a un tavolo già aperto, oppure scegli un formato in alto per aprirne uno nuovo.
      </p>
    );
  }

  return (
    <article className="arena-panel group p-4 sm:p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Tavolo libero</p>
          <h3 className="mt-0.5 truncate font-display text-base font-black leading-snug text-white sm:text-lg">
            Siediti e apri una sfida
          </h3>
        </div>
        <span className="rounded-full border border-dashed border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
          Vuoto
        </span>
      </header>

      <div className="mt-4">
        <TableStage
          far={{ occupied: false, label: 'Giocatore 1' }}
          near={{ occupied: false, label: 'Giocatore 2' }}
          tone="empty"
        />
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3.5">
        <Button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!busy) onSit(table);
          }}
          className="h-[38px] gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 text-xs font-black text-white shadow-xs transition-all hover:brightness-105 hover:shadow-sm active:scale-95"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden />
          <span>SIEDITI</span>
        </Button>
        <TableMetaChips seatedCount={0} bestOf={bestOf} price={price} />
      </footer>
    </article>
  );
}
