'use client';

import { FORMATS_WITH_MEDIA } from '@/lib/data/format-media';
import type { FormatId } from '@/lib/data/catalog';
import { StyledSelect } from '@/components/ui/styled-select';

interface FormatPillSelectProps {
  value: FormatId;
  onChange: (value: FormatId) => void;
  /** id dell'etichetta esterna (accessibilità). */
  ariaLabelledBy?: string;
}

/** Dropdown formato a pillola: superficie chiara, coerente con la lobby Apple-style. */
export function FormatPillSelect({ value, onChange, ariaLabelledBy }: FormatPillSelectProps) {

  return (
    <div className="relative w-full rounded-full bg-white text-header-bg ring-1 ring-slate-900/[0.12] shadow-sm transition-shadow hover:ring-slate-900/20">
      <StyledSelect
        value={value}
        onChange={onChange}
        options={FORMATS_WITH_MEDIA.map((f) => ({ value: f.id, label: f.name }))}
        variant="pill"
        ariaLabelledBy={ariaLabelledBy}
        className="relative flex w-full"
        triggerClassName="h-14 w-full justify-between bg-transparent px-5 text-[13px] font-bold uppercase tracking-wide text-header-bg ring-0 hover:bg-slate-50/60"
      />
    </div>
  );
}
