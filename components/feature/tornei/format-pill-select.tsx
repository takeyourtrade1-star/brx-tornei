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
    <div className="relative w-full rounded-full bg-white text-header-bg ring-1 ring-slate-900/[0.12] shadow-sm transition-shadow hover:ring-slate-900/20">
      {children}
    </div>
  );
}

export function FormatPillSelect(props: FormatPillSelectProps) {
  const triggerClassName =
    'h-14 w-full justify-between bg-transparent px-5 text-[13px] font-bold uppercase tracking-wide text-header-bg ring-0 hover:bg-slate-50/60';

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
