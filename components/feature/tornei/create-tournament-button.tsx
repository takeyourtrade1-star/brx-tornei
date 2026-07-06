'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Selection } from '@/lib/validations/selection';
import {
  tournamentActionButtonClass,
  tournamentActionIconClass,
} from './tournament-action-button-styles';
import {
  CreateTournamentModal,
  type CreateTournamentResult,
} from './create-tournament-modal';

interface CreateTournamentButtonProps {
  selection: Selection;
  formatName: string;
  modeName: string;
  onCreated?: (result: CreateTournamentResult) => void;
}

export function CreateTournamentButton({
  selection,
  formatName,
  modeName,
  onCreated,
}: CreateTournamentButtonProps) {
  const [open, setOpen] = useState(false);

  function handleCreated(result: CreateTournamentResult) {
    setOpen(false);
    onCreated?.(result);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={tournamentActionButtonClass('md')}
      >
        <Plus className={tournamentActionIconClass} />
        Crea torneo
      </button>

      <CreateTournamentModal
        open={open}
        selection={selection}
        formatName={formatName}
        modeName={modeName}
        onClose={() => setOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
