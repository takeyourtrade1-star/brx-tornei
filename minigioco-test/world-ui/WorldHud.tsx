'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AssoPixel } from './asso-pixel';
import { getWorldActions, getWorldDestinations, getWorldRoomInfo } from './navigation';
import type { WorldActionDescriptor, WorldHudProps } from './types';
import { WorldIcon } from './world-icon';
import { WorldModalShell } from './WorldModalShell';
import { WorldSettings } from './WorldSettings';

function ActionButton({
  action,
  index,
  selected,
  disabled,
  onAction,
}: {
  readonly action: WorldActionDescriptor;
  readonly index: number;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly onAction: WorldHudProps['onAction'];
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={cn(
        'group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm border px-2 text-left text-[10px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg disabled:pointer-events-none disabled:opacity-45 sm:text-xs',
        selected
          ? 'border-primary/70 bg-primary/15 text-white'
          : 'border-transparent text-white/75 hover:border-primary/50 hover:bg-primary/10 hover:text-white',
      )}
      onClick={() => onAction(action.id)}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      disabled={disabled}
      title={`${action.label}: ${action.hint}`}
      aria-label={`${action.label}. ${action.hint}`}
      aria-pressed={selected}
      data-world-action-id={action.id}
      data-world-tutorial-index={index}
    >
      <WorldIcon name={action.icon} size={16} className="shrink-0" />
      <span>{action.shortLabel}</span>
    </button>
  );
}

export function WorldHud({
  room,
  roomLabel,
  username,
  onlineLabel,
  avatar,
  nearby,
  quality = 'high',
  muted = false,
  tutorialAvailable = false,
  onNavigate,
  onAction,
  onWardrobe,
  onQualityChange,
  onMusicToggle,
  onTutorial,
  onOverlayChange,
  actionDisabled = false,
  className,
}: WorldHudProps): React.JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const info = getWorldRoomInfo(room);
  const nearbyActionId = nearby?.actionId;

  useEffect(() => {
    onOverlayChange?.(settingsOpen);

    return () => {
      onOverlayChange?.(false);
    };
  }, [onOverlayChange, settingsOpen]);

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-20 bg-header-bg/0', className)}
      onKeyDown={(event) => event.stopPropagation()}
      data-world-hud="true"
    >
      <section
        className="pointer-events-auto absolute left-2 top-2 h-[4.25rem] w-[min(17rem,calc(100vw-7rem))] rounded-md border border-white/15 bg-header-bg p-2 text-white shadow-xl backdrop-blur-sm sm:left-4 sm:top-4 sm:h-auto sm:w-72 sm:p-3"
        aria-label="Identità Asso World"
      >
        <div className="flex h-full items-center gap-2">
          <div className="grid h-9 w-8 shrink-0 place-items-center overflow-hidden rounded-sm border border-primary/40 bg-background/10 p-1 sm:h-10 sm:w-9">
            {avatar || <AssoPixel className="h-full w-full" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="hidden truncate text-[9px] font-bold uppercase tracking-[0.18em] text-primary sm:block">
              {info.kicker}
            </p>
            <div className="flex min-w-0 items-center gap-1.5">
              <WorldIcon name={info.icon} size={15} className="shrink-0 text-primary" />
              <h1 className="truncate font-display text-sm sm:text-base">{roomLabel || info.label}</h1>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-white/70">
              {username}
              {onlineLabel && <span className="ml-2 text-white/45">{onlineLabel}</span>}
            </p>
          </div>
        </div>
      </section>

      <nav
        aria-label="Visita una sala"
        className="pointer-events-auto absolute left-2 right-2 top-[4.75rem] h-11 overflow-x-auto sm:left-4 sm:right-auto sm:top-[5.5rem]"
      >
        <div className="flex h-11 min-w-max items-center gap-1 rounded-md border border-white/10 bg-header-bg px-1 shadow-lg backdrop-blur-sm">
          {getWorldDestinations(room).map((destination) => (
            <button
              key={destination.room}
              type="button"
              className="inline-flex h-11 min-h-11 shrink-0 items-center gap-1.5 rounded-sm border border-transparent px-2 text-[10px] font-bold uppercase tracking-wide text-white/75 hover:border-primary/50 hover:bg-primary/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg disabled:pointer-events-none disabled:opacity-45 sm:text-xs"
              onClick={() => onNavigate(destination.room)}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              disabled={actionDisabled}
              title={`${destination.label}: ${destination.hint}`}
              aria-label={`Visita ${destination.label}. ${destination.hint}`}
            >
              <WorldIcon name={destination.icon} size={15} className="shrink-0" />
              <span>{destination.shortLabel}</span>
              <WorldIcon name="chevron-right" size={13} className="text-primary" />
            </button>
          ))}
        </div>
      </nav>

      <div className="pointer-events-auto absolute right-2 top-2 flex gap-1 sm:right-4 sm:top-4">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-white/15 bg-header-bg text-white/80 shadow-lg backdrop-blur-sm hover:border-primary/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg disabled:pointer-events-none disabled:opacity-45"
          onClick={onWardrobe}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          disabled={actionDisabled}
          aria-label="Apri il guardaroba e personalizza Asso"
          title="Guardaroba"
        >
          <WorldIcon name="shirt" size={18} />
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-white/15 bg-header-bg text-white/80 shadow-lg backdrop-blur-sm hover:border-primary/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg"
          onClick={() => setSettingsOpen(true)}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label="Apri impostazioni Asso World"
          aria-expanded={settingsOpen}
          title="Impostazioni"
        >
          <WorldIcon name="settings" size={18} />
        </button>
      </div>

      <div className="pointer-events-auto absolute bottom-2 left-1/2 w-[calc(100%-1rem)] -translate-x-1/2 sm:bottom-4 sm:w-auto">
        {nearby && (
          <div className="mx-auto mb-1 flex max-w-[min(28rem,calc(100vw-1rem))] items-center gap-2 rounded-sm border border-white/10 bg-header-bg px-2 py-1.5 text-white shadow-lg backdrop-blur-sm" aria-live="polite">
            <span
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                nearby.state === 'blocked' ? 'bg-destructive' : 'bg-primary',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold">{nearby.label}</p>
              {nearby.hint && <p className="truncate text-[10px] text-white/50">{nearby.hint}</p>}
            </div>
            {nearbyActionId && (
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm border border-primary/45 bg-primary/15 px-1.5 text-[9px] font-bold uppercase tracking-wide text-white hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg disabled:pointer-events-none disabled:opacity-45"
                onClick={() => onAction(nearbyActionId)}
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                disabled={nearby.state === 'blocked' || actionDisabled}
                aria-label={`Interagisci: ${nearby.label}`}
              >
                Vai
              </button>
            )}
          </div>
        )}
        <section aria-label="Azioni della stanza" className="mx-auto max-w-full overflow-x-auto">
          <div className="flex min-w-max gap-1 rounded-md border border-white/10 bg-header-bg p-1 shadow-lg backdrop-blur-sm">
            {getWorldActions(room).map((action, index) => (
              <ActionButton
                key={action.id}
                action={action}
                index={index}
                selected={action.id === nearbyActionId}
                disabled={actionDisabled}
                onAction={onAction}
              />
            ))}
          </div>
        </section>
      </div>

      {settingsOpen && (
        <WorldModalShell
          id="world-settings"
          title="Impostazioni Asso World"
          description="Qualità, audio e guida restano sotto il tuo controllo."
          onClose={() => setSettingsOpen(false)}
        >
          <WorldSettings
            quality={quality}
            muted={muted}
            tutorialAvailable={tutorialAvailable}
            onQualityChange={onQualityChange}
            onMusicToggle={onMusicToggle}
            onTutorial={onTutorial}
            onClose={() => setSettingsOpen(false)}
          />
        </WorldModalShell>
      )}
    </div>
  );
}
