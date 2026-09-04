'use client';

import { cn } from '@/lib/utils';
import type { WorldQuality } from './types';
import { WorldIcon } from './world-icon';

export interface WorldSettingsProps {
  readonly quality: WorldQuality;
  readonly muted: boolean;
  readonly tutorialAvailable: boolean;
  readonly onQualityChange?: (quality: WorldQuality) => void;
  readonly onMusicToggle?: () => void;
  readonly onTutorial?: () => void;
  readonly onClose: () => void;
}

interface QualityChoiceProps {
  readonly value: WorldQuality;
  readonly current: WorldQuality;
  readonly disabled: boolean;
  readonly onChange?: (quality: WorldQuality) => void;
}

function QualityChoice({ value, current, disabled, onChange }: QualityChoiceProps): React.JSX.Element {
  const active = value === current;

  return (
    <button
      type="button"
      className={cn(
        'flex min-h-11 items-center justify-between rounded-sm border px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-45',
        active
          ? 'border-primary/60 bg-primary/10 text-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
      onClick={() => onChange?.(value)}
      disabled={disabled}
      aria-pressed={active}
    >
      <span>{value === 'high' ? 'Qualità alta' : 'Modalità leggera'}</span>
      {active && <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Attiva</span>}
    </button>
  );
}

export function WorldSettings({
  quality,
  muted,
  tutorialAvailable,
  onQualityChange,
  onMusicToggle,
  onTutorial,
  onClose,
}: WorldSettingsProps): React.JSX.Element {
  const handleTutorial = () => {
    onClose();
    onTutorial?.();
  };

  return (
    <div className="space-y-5">
      <section className="space-y-2" aria-labelledby="world-quality-title">
        <h3 id="world-quality-title" className="font-display text-sm text-foreground">
          <WorldIcon name="spark" size={16} className="mr-2 inline text-primary" />
          Qualità grafica
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <QualityChoice
            value="high"
            current={quality}
            disabled={!onQualityChange}
            onChange={onQualityChange}
          />
          <QualityChoice
            value="low"
            current={quality}
            disabled={!onQualityChange}
            onChange={onQualityChange}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          La modalità leggera riduce frame ed effetti per telefoni e PC meno potenti.
        </p>
      </section>

      <section className="space-y-2" aria-labelledby="world-audio-title">
        <h3 id="world-audio-title" className="font-display text-sm text-foreground">
          <WorldIcon name="music" size={16} className="mr-2 inline text-primary" />
          Audio
        </h3>
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between rounded-sm border border-border bg-background px-3 text-left text-sm text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-45"
          onClick={onMusicToggle}
          disabled={!onMusicToggle}
          aria-pressed={!muted}
        >
          <span>{muted ? 'Riattiva musica e suoni' : 'Silenzia musica e suoni'}</span>
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {muted ? 'Off' : 'On'}
          </span>
        </button>
      </section>

      <section className="space-y-2" aria-labelledby="world-tutorial-title">
        <h3 id="world-tutorial-title" className="font-display text-sm text-foreground">
          Guida
        </h3>
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between rounded-sm border border-border bg-background px-3 text-left text-sm text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-45"
          onClick={handleTutorial}
          disabled={!tutorialAvailable || !onTutorial}
        >
          <span>{tutorialAvailable ? 'Ripeti il tutorial di Asso' : 'Tutorial non disponibile'}</span>
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {tutorialAvailable ? 'Apri' : '—'}
          </span>
        </button>
      </section>

      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-sm bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          onClick={onClose}
        >
          Chiudi impostazioni
        </button>
      </div>
    </div>
  );
}
