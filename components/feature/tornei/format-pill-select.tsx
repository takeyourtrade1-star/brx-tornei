'use client';

import type { ReactNode } from 'react';
import { FORMATS_WITH_MEDIA } from '@/lib/data/format-media';
import type { FormatId } from '@/lib/data/catalog';
import type { FormatFilter } from '@/lib/validations/selection';
import { StyledSelect } from '@/components/ui/styled-select';

type FormatPillSelectProps =
  | {
      /** Dropdown formato a pillola (solo formati espliciti, es. creazione mazzo). */
      includeAll?: false;
      value: FormatId;
      onChange: (value: FormatId) => void;
      ariaLabelledBy?: string;
    }
  | {
      /** Lobby: include l'opzione aggregata "Tutti i formati". */
      includeAll: true;
      value: FormatFilter;
      onChange: (value: FormatFilter) => void;
      ariaLabelledBy?: string;
    };

const FORMAT_OPTIONS = FORMATS_WITH_MEDIA.map((f) => ({ value: f.id, label: f.name }));

function PillShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full rounded-full border border-white/15 bg-white/10 text-white ring-1 ring-white/10 shadow-sm backdrop-blur-md transition-all hover:border-white/25">
      {children}
    </div>
  );
}

export function FormatPillSelect(props: FormatPillSelectProps) {
  const triggerClassName =
    'h-14 w-full justify-between bg-transparent px-5 text-[13px] font-bold uppercase tracking-wide text-white ring-0 hover:bg-white/10';

  if (props.includeAll) {
    const options: { value: FormatFilter; label: string }[] = [
      { value: 'all', label: 'Tutti i formati' },
      ...FORMAT_OPTIONS,
    ];
    return (
      <PillShell>
        <StyledSelect<FormatFilter>
          value={props.value}
          onChange={props.onChange}
          options={options}
          variant="pill"
          ariaLabelledBy={props.ariaLabelledBy}
          className="relative flex w-full"
          triggerClassName={triggerClassName}
        />
      </PillShell>
    );
  }

  return (
    <PillShell>
      <StyledSelect<FormatId>
        value={props.value}
        onChange={props.onChange}
        options={FORMAT_OPTIONS}
        variant="pill"
        ariaLabelledBy={props.ariaLabelledBy}
        className="relative flex w-full"
        triggerClassName={triggerClassName}
      />
    </PillShell>
  );
}
