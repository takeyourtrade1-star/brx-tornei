'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Layers, Grid } from 'lucide-react';

interface FormatItem {
  readonly id: string;
  readonly name: string;
  readonly gradient: string;
}

interface FormatSelectorFanProps {
  formats: readonly FormatItem[];
  selectedId?: string;
}

/** Colore accent per ogni formato (derivato dai gradienti del design system). */
const CARD_META: Record<string, { accent: string; label: string }> = {
  'old-school':  { accent: '#FF9F5A', label: 'Classico' },
  'premodern':   { accent: '#4EEAEC', label: 'Nostalgico' },
  'pioneer':     { accent: '#FF5A92', label: 'Non Rotante' },
  'modern':      { accent: '#C89CFF', label: 'Dinamico' },
  'standard':    { accent: '#4EEAEC', label: 'In Rotazione' },
  'legacy':      { accent: '#FFB86A', label: 'Eterno' },
  'commander':   { accent: '#FF6BA0', label: 'Multiplayer' },
};

export function FormatSelectorFan({ formats, selectedId }: FormatSelectorFanProps) {
  const [viewMode, setViewMode] = useState<'fan' | 'row'>(selectedId ? 'row' : 'fan');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isParentHovered, setIsParentHovered] = useState(false);

  const midIndex = Math.floor(formats.length / 2);

  const scrollToModalita = useCallback(() => {
    setTimeout(() => {
      document.getElementById('modalita')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle Desktop */}
      <div className="hidden sm:flex justify-end">
        <div className="inline-flex rounded-full bg-white/5 p-1 border border-white/10 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setViewMode('fan')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
              viewMode === 'fan'
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-white/60 hover:text-white/90 hover:bg-white/5"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Ventaglio</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('row')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
              viewMode === 'row'
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-white/60 hover:text-white/90 hover:bg-white/5"
            )}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>In fila</span>
          </button>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="grid grid-cols-2 gap-3 sm:hidden justify-items-center">
        {formats.map((format) => (
          <MobileCard
            key={format.id}
            format={format}
            selected={selectedId === format.id}
            onNavigate={scrollToModalita}
          />
        ))}
      </div>

      {/* ── Desktop ── */}
      <div className="hidden sm:block">
        <div
          onMouseEnter={() => setIsParentHovered(true)}
          onMouseLeave={() => { setIsParentHovered(false); setHoveredIndex(null); }}
          className={cn(
            "relative w-full transition-all duration-300",
            viewMode === 'fan'
              ? "h-[320px] flex items-center justify-center"
              : "flex flex-nowrap justify-center gap-3 py-4"
          )}
        >
          {formats.map((format, index) => (
            <DesktopCard
              key={format.id}
              format={format}
              index={index}
              midIndex={midIndex}
              selected={selectedId === format.id}
              hoveredIndex={hoveredIndex}
              isParentHovered={isParentHovered}
              viewMode={viewMode}
              onHover={setHoveredIndex}
              onNavigate={scrollToModalita}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Sotto-componenti ─────────────────────────── */

/** Brackets angolari decorativi (stile viewfinder) */
function CornerBrackets({ color }: { color: string }) {
  const style = { borderColor: color };
  const base = "absolute w-3.5 h-3.5 pointer-events-none";
  return (
    <>
      <div className={cn(base, "top-3 left-3 border-t-2 border-l-2 rounded-tl-sm")} style={style} />
      <div className={cn(base, "top-3 right-3 border-t-2 border-r-2 rounded-tr-sm")} style={style} />
      <div className={cn(base, "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-sm")} style={style} />
      <div className={cn(base, "bottom-3 right-3 border-b-2 border-r-2 rounded-br-sm")} style={style} />
    </>
  );
}

/** Icona diamante decorativa */
function Diamond({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
      <path d="M8 1l3 5-3 5-3-5z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/** Contenuto interno — design ispirato alla reference BRX */
function CardContent({ format, selected, size }: {
  format: FormatItem;
  selected: boolean;
  size: 'sm' | 'lg';
}) {
  const meta = CARD_META[format.id] || { accent: '#ffffff', label: '' };
  const isLg = size === 'lg';

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center">
      <CornerBrackets color={`${meta.accent}88`} />

      {/* Diamante decorativo */}
      <div className={cn("mb-2", isLg ? "mb-3" : "mb-2")}>
        <Diamond color={`${meta.accent}cc`} />
      </div>

      {/* Nome formato — grande e colorato */}
      <h3
        className={cn(
          "font-display uppercase tracking-wider leading-none text-center px-4",
          isLg ? "text-xl" : "text-base"
        )}
        style={{
          color: meta.accent,
          textShadow: `0 0 12px ${meta.accent}60, 0 0 30px ${meta.accent}25`,
        }}
      >
        {format.name}
      </h3>

      {/* Etichetta sotto */}
      <span
        className={cn(
          "font-display uppercase tracking-[0.25em] mt-2",
          isLg ? "text-[10px]" : "text-[8px]"
        )}
        style={{
          color: `${meta.accent}88`,
          textShadow: `0 0 8px ${meta.accent}30`,
        }}
      >
        {meta.label}
      </span>

      {/* Indicatore selezione */}
      {selected && (
        <div
          className={cn("mt-3 rounded-full px-3 font-display uppercase tracking-wider", isLg ? "py-1 text-[9px]" : "py-0.5 text-[7px]")}
          style={{ backgroundColor: `${meta.accent}20`, color: meta.accent, border: `1px solid ${meta.accent}40` }}
        >
          Selezionato
        </div>
      )}
    </div>
  );
}

function MobileCard({ format, selected, onNavigate }: {
  format: FormatItem;
  selected: boolean;
  onNavigate: () => void;
}) {
  const meta = CARD_META[format.id] || { accent: '#ffffff', label: '' };

  return (
    <Link
      href={`/hub?format=${format.id}#modalita`}
      scroll={false}
      onClick={onNavigate}
      className="w-[150px] h-[210px] rounded-2xl flex flex-col select-none cursor-pointer overflow-hidden transition-all duration-300 group"
      style={{
        background: 'rgba(10, 14, 28, 0.9)',
        border: `1.5px solid ${selected ? meta.accent : `${meta.accent}30`}`,
        boxShadow: selected
          ? `0 0 25px ${meta.accent}30, 0 0 60px ${meta.accent}15, inset 0 0 15px ${meta.accent}08`
          : `0 0 15px ${meta.accent}08`,
      }}
    >
      <CardContent format={format} selected={selected} size="sm" />
    </Link>
  );
}

function DesktopCard({ format, index, midIndex, selected, hoveredIndex, isParentHovered, viewMode, onHover, onNavigate }: {
  format: FormatItem;
  index: number;
  midIndex: number;
  selected: boolean;
  hoveredIndex: number | null;
  isParentHovered: boolean;
  viewMode: 'fan' | 'row';
  onHover: (i: number | null) => void;
  onNavigate: () => void;
}) {
  const meta = CARD_META[format.id] || { accent: '#ffffff', label: '' };
  const offset = index - midIndex;
  const isHovered = hoveredIndex === index;

  let rot = offset * (isParentHovered ? 5.5 : 8);
  let tx = offset * (isParentHovered ? 76 : 56);
  let ty = Math.abs(offset) * (isParentHovered ? 5 : 10);
  let scale = 1;
  let zIndex = 10 + index;

  if (viewMode === 'fan') {
    if (isHovered) {
      rot = 0;
      tx = offset * (isParentHovered ? 68 : 50);
      ty = -45;
      scale = 1.18;
      zIndex = 50;
    } else if (hoveredIndex !== null) {
      const shift = index < hoveredIndex ? -24 : 24;
      tx += shift;
      scale = 0.94;
      zIndex = index < hoveredIndex ? 10 + index : 10 + index - 1;
    }
  } else {
    rot = 0; tx = 0; ty = 0;
    if (isHovered) { ty = -12; scale = 1.06; zIndex = 30; }
  }

  const borderColor = selected || isHovered ? meta.accent : `${meta.accent}30`;
  const glowIntensity = selected ? '35' : isHovered ? '25' : '08';

  const style = viewMode === 'fan' ? {
    position: 'absolute' as const,
    left: '50%',
    marginLeft: '-95px',
    transform: `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg) scale(${scale})`,
    zIndex,
    transition: 'all 0.35s cubic-bezier(0.25,0.8,0.25,1)',
    background: 'rgba(10, 14, 28, 0.92)',
    border: `1.5px solid ${borderColor}`,
    boxShadow: `0 0 25px ${meta.accent}${glowIntensity}, 0 0 60px ${meta.accent}${selected ? '18' : '08'}, inset 0 0 20px ${meta.accent}06`,
  } : {
    transform: `translateY(${ty}px) scale(${scale})`,
    zIndex,
    transition: 'all 0.35s cubic-bezier(0.25,0.8,0.25,1)',
    background: 'rgba(10, 14, 28, 0.92)',
    border: `1.5px solid ${borderColor}`,
    boxShadow: `0 0 25px ${meta.accent}${glowIntensity}, 0 0 60px ${meta.accent}${selected ? '18' : '08'}, inset 0 0 20px ${meta.accent}06`,
  };

  return (
    <Link
      href={`/hub?format=${format.id}#modalita`}
      scroll={false}
      onClick={onNavigate}
      style={style}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "rounded-2xl flex flex-col select-none cursor-pointer overflow-hidden backdrop-blur-md group",
        viewMode === 'fan' ? "w-[190px] h-[270px]" : "w-[140px] h-[200px]"
      )}
    >
      <CardContent format={format} selected={selected} size={viewMode === 'fan' ? 'lg' : 'sm'} />
    </Link>
  );
}
