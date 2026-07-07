'use client';

import Image from 'next/image';
import { FORMATS_WITH_MEDIA } from '@/lib/data/format-media';
import type { FormatId } from '@/lib/data/catalog';
import { StyledSelect } from '@/components/ui/styled-select';

interface FormatPillSelectProps {
  value: FormatId;
  onChange: (value: FormatId) => void;
  /** id dell'etichetta esterna (accessibilità). */
  ariaLabelledBy?: string;
}

/** Dropdown formato a pillola con sfondo illustrato (stile toolbar mobile). */
export function FormatPillSelect({ value, onChange, ariaLabelledBy }: FormatPillSelectProps) {
  const current = FORMATS_WITH_MEDIA.find((f) => f.id === value);

  return (
    <div className="relative w-full overflow-hidden rounded-full bg-header-bg/80 text-white ring-1 ring-white/[0.12]">
      {current && (
        <span className="pointer-events-none absolute inset-0" aria-hidden>
          <Image
            src={current.pill}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover object-center brightness-90"
            draggable={false}
          />
          <span className="absolute inset-0 bg-gradient-to-r from-header-bg via-header-bg/65 to-header-bg/10" />
        </span>
      )}
      <StyledSelect
        value={value}
        onChange={onChange}
        options={FORMATS_WITH_MEDIA.map((f) => ({ value: f.id, label: f.name }))}
        variant="pill"
        ariaLabelledBy={ariaLabelledBy}
        className="relative flex w-full"
        triggerClassName="h-14 w-full justify-between bg-transparent px-4 text-[13px] font-bold uppercase tracking-wide text-white ring-0 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] hover:bg-white/[0.04]"
      />
    </div>
  );
}
