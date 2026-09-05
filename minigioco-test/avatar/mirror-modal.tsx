'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { AssoWorldHair, AssoWorldLook, AssoWorldOutfit } from '../../types/asso-world';
import { parseAssoWorldLook } from '../../lib/asso-world-look';
import {
  DEFAULT_LOOK,
  MIRROR_HAIR_OPTIONS,
  MIRROR_LOOK_PRESETS,
  MIRROR_OUTFIT_OPTIONS,
  randomCanonicalAssoWorldLook,
  type AssoWorldLookPatch,
} from './mirror-contract';
import { CharacterPreview } from '../high-detail/character-preview';
import { buildAvatar } from './avatar-sprite-renderer';
import {
  AVATAR_DIRECTION_LABELS,
  DEFAULT_AVATAR_PREVIEW_FRAME,
  drawAvatarPreviewFrame,
  getAvatarPreviewSprite,
  nextAvatarPreviewFrame,
  staticAvatarPreviewFrame,
  type AvatarPreviewFrame,
  type AvatarPreviewMotion,
} from './avatar-preview';
export interface MirrorModalProps {
  readonly look: AssoWorldLook;
  /** Riceve solo il patch scelto; il parent fa merge, validation e salvataggio. */
  readonly onChange: (patch: AssoWorldLookPatch) => void;
  readonly pending?: boolean;
  readonly error?: string | null;
  /** Ritenta il salvataggio dell'ultimo look gestito dal parent. */
  readonly retrySave?: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly quality?: 'high' | 'low';
}
const OUTFIT_SWATCH_CLASSES: Readonly<Record<AssoWorldOutfit, string>> = {
  tank: 'bg-foreground',
  hoodie: 'bg-primary',
  jacket: 'bg-secondary-foreground',
  shirt: 'bg-secondary',
  jersey: 'bg-destructive',
};
function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);
  return reducedMotion;
}
export function MirrorModal({
  look,
  onChange,
  pending = false,
  error = null,
  retrySave,
  disabled = false,
  className,
  quality = 'high',
}: MirrorModalProps) {
  const titleId = useId();
  const helpId = `${titleId}-help`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const [motion, setMotion] = useState<AvatarPreviewMotion>('idle');
  const [preview, setPreview] = useState<AvatarPreviewFrame>(DEFAULT_AVATAR_PREVIEW_FRAME);
  const safeLook = useMemo(() => parseAssoWorldLook(look), [look]);
  const avatar = useMemo(() => buildAvatar(safeLook), [safeLook]);
  const frame = staticAvatarPreviewFrame(preview, reducedMotion);
  const directionLabel = AVATAR_DIRECTION_LABELS[frame.direction];
  const locked = disabled;
  useEffect(() => {
    if (reducedMotion || quality === 'high') {
      setPreview((current) => staticAvatarPreviewFrame(current, true));
      return undefined;
    }
    let rafId = 0;
    let previous = 0;
    const tick = (now: number) => {
      const delay = motion === 'walk' ? 180 : 360;
      if (now - previous >= delay) {
        previous = now;
        setPreview((current) => ({ ...nextAvatarPreviewFrame(current, motion, false), direction: current.direction }));
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [motion, reducedMotion, quality]);
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sprite = getAvatarPreviewSprite(avatar, {
      direction: frame.direction,
      pose: frame.motion,
      frame: frame.frame,
    });
    drawAvatarPreviewFrame(canvas, sprite);
  }, [avatar, frame]);

  useEffect(() => renderPreview(), [renderPreview]);
  const setHair = useCallback((hair: AssoWorldHair) => onChange({ hair }), [onChange]);
  const setOutfit = useCallback((outfit: AssoWorldOutfit) => onChange({ outfit }), [onChange]);
  const applyPreset = useCallback((value: AssoWorldLook) => onChange(value), [onChange]);
  const resetLook = useCallback(() => onChange(DEFAULT_LOOK), [onChange]);
  const randomizeLook = useCallback(() => onChange(randomCanonicalAssoWorldLook()), [onChange]);
  const rotatePreview = useCallback(() => {
    setPreview((current) => nextAvatarPreviewFrame(current, motion, reducedMotion));
  }, [motion, reducedMotion]);
  return (
    <section
      className={['w-full text-card-foreground', className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      aria-busy={pending || undefined}
    >
      <h2 id={titleId} className="sr-only">Personalizza il tuo Asso</h2>
      <div className="grid gap-5 md:grid-cols-[minmax(11rem,0.8fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-3">
          <div className="grid min-h-[12rem] md:min-h-[18rem] place-items-center overflow-hidden rounded-2xl border border-border bg-muted/40 p-3">
            {quality === 'high' ? <CharacterPreview look={safeLook} direction={frame.direction}
              walking={motion === 'walk'} reducedMotion={reducedMotion}
              label={`Anteprima avatar: vista ${directionLabel}, modalità ${motion === 'walk' ? 'cammino' : 'fermo'}`} /> : <canvas
              ref={canvasRef}
              width={132}
              height={232}
              className="block h-auto w-[90px] max-w-full md:w-[132px]"
              role="img"
              aria-label={`Anteprima avatar: vista ${directionLabel}, modalità ${frame.motion === 'walk' ? 'cammino' : 'fermo'}`}
              aria-describedby={helpId}
            >
              Anteprima avatar Asso World
            </canvas>}
          </div>
          <p id={helpId} className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {reducedMotion ? 'Animazioni ridotte: anteprima fissa.' : `Vista: ${directionLabel}.`}
          </p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Prova movimento avatar">
            {(['idle', 'walk'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className="min-h-11 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary rounded-xl border border-border px-3 py-2 text-xs font-bold transition hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-pressed={motion === value}
                aria-label={value === 'walk' && reducedMotion ? 'Cammino, disattivato con animazioni ridotte' : value === 'walk' ? 'Cammino' : 'Fermo'}
                disabled={locked || (value === 'walk' && reducedMotion)}
                onClick={() => setMotion(value)}
              >
                {value === 'walk' ? 'Cammino' : 'Fermo'}
              </button>
            ))}
            <button
              type="button"
              className="min-h-11 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary rounded-xl border border-border px-3 py-2 text-xs font-bold transition hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={locked}
              aria-label="Ruota manualmente la vista dell'avatar"
              onClick={rotatePreview}
            >
              Ruota
            </button>
          </div>
        </div>
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Capelli</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MIRROR_HAIR_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="min-h-11 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary group rounded-xl border border-border bg-background/50 px-2.5 py-2 text-left text-xs font-bold transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50"
                  aria-pressed={safeLook.hair === option.id}
                  aria-label={option.label}
                  disabled={locked}
                  onClick={() => setHair(option.id)}
                >
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground group-hover:text-primary" aria-hidden="true">✦</span>
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Outfit</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MIRROR_OUTFIT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="min-h-11 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary group flex items-center gap-2 rounded-xl border border-border bg-background/50 px-2.5 py-2 text-left text-xs font-bold transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50"
                  aria-pressed={safeLook.outfit === option.id}
                  disabled={locked}
                  onClick={() => setOutfit(option.id)}
                >
                  <span className={`h-3 w-3 shrink-0 rounded-full ring-1 ring-border ${OUTFIT_SWATCH_CLASSES[option.id]}`} aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Idee di stile</h3>
              <button type="button" className="text-[10px] font-black uppercase tracking-wide text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" disabled={locked} onClick={randomizeLook}>Casuale</button>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {MIRROR_LOOK_PRESETS.map((preset) => {
                const selected = safeLook.hair === preset.look.hair && safeLook.outfit === preset.look.outfit;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className="min-h-11 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary shrink-0 rounded-xl border border-border px-3 py-2 text-left text-[11px] font-bold transition hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50"
                    aria-pressed={selected}
                    disabled={locked}
                    onClick={() => applyPreset(preset.look)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <button type="button" className="text-xs font-bold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" disabled={locked} onClick={resetLook}>Look iniziale</button>
            <div className="flex min-h-5 items-center gap-2 text-right text-[11px] font-bold" aria-live="polite">
              {pending ? <span className="text-primary">Salvataggio…</span> : null}
              {!pending && error ? <span role="alert" className="text-destructive">{error}</span> : null}
              {!pending && error && retrySave ? <button type="button" className="text-primary underline-offset-2 hover:underline disabled:opacity-50" disabled={locked} onClick={retrySave}>Riprova</button> : null}
              {!pending && !error ? <span className="text-muted-foreground">Look salvato</span> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
