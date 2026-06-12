'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Selection } from '@/lib/validations/selection';
import { selectionQuery } from '@/lib/validations/selection';

interface CreateDeckButtonProps {
  selection: Selection;
}

/** CTA "Crea mazzo" — apre il builder su /mazzi/nuovo. */
export function CreateDeckButton({ selection }: CreateDeckButtonProps) {
  return (
    <Link
      href={`/mazzi/nuovo${selectionQuery(selection)}`}
      className="brx-liquid-glass-btn flex items-center gap-2 rounded-full px-6 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-white"
    >
      <Plus className="h-4 w-4" />
      Crea mazzo
    </Link>
  );
}
