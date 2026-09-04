'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { TUT_UI_HOTSPOTS } from '../world-client/tutorial-timing.js';
import type { TutorialHotspotSide, TutorialHotspotSpec, TutorialHotspotsMap } from './types';

interface TutorialUiHotspotsProps {
  readonly wrapRef: RefObject<HTMLElement | null>;
  readonly uiId?: string | null;
  readonly hotspots?: TutorialHotspotsMap;
}

interface Spot {
  readonly key: number;
  readonly label: string;
  readonly side: TutorialHotspotSide;
  readonly delay: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

interface TargetEntry {
  readonly el: HTMLElement;
  readonly delay: number;
}

const DEFAULT_HOTSPOTS = TUT_UI_HOTSPOTS as TutorialHotspotsMap;

function resolveTarget(root: HTMLElement, spec: TutorialHotspotSpec, index: number): HTMLElement | null {
  if (spec.sel) {
    try {
      const selected = root.querySelector<HTMLElement>(spec.sel);
      if (selected) return selected;
    } catch {
      // Configurazione controllata: il fallback mantiene il tutorial utilizzabile anche con un selettore datato.
    }
  }
  return root.querySelector<HTMLElement>(`[data-world-tutorial-index="${index}"]`);
}

function isMeasurable(element: HTMLElement): boolean {
  return (
    element.getClientRects().length > 0 &&
    !element.hidden &&
    element.getAttribute('aria-hidden') !== 'true' &&
    !element.hasAttribute('inert') &&
    !element.closest('[inert]')
  );
}

export function TutorialUiHotspots({
  wrapRef,
  uiId,
  hotspots = DEFAULT_HOTSPOTS,
}: TutorialUiHotspotsProps): React.JSX.Element | null {
  const [spots, setSpots] = useState<readonly Spot[]>([]);
  const taggedRef = useRef<Set<HTMLElement>>(new Set());

  useEffect(() => {
    const clearTargets = () => {
      taggedRef.current.forEach((element) => {
        element.classList.remove('irg-spot-target');
        element.style.removeProperty('--irg-spot-delay');
      });
      taggedRef.current.clear();
    };

    if (!uiId) {
      clearTargets();
      setSpots([]);
      return undefined;
    }

    const specs = hotspots[uiId];
    if (!specs?.length) {
      clearTargets();
      setSpots([]);
      return undefined;
    }

    let alive = true;
    let timer: number | undefined;
    let previous = '';

    const syncTargets = (entries: readonly TargetEntry[]) => {
      const next = new Set(entries.map((entry) => entry.el));
      taggedRef.current.forEach((element) => {
        if (!next.has(element)) {
          element.classList.remove('irg-spot-target');
          element.style.removeProperty('--irg-spot-delay');
          taggedRef.current.delete(element);
        }
      });
      entries.forEach(({ el, delay }) => {
        el.style.setProperty('--irg-spot-delay', `${delay}s`);
        el.classList.add('irg-spot-target');
        taggedRef.current.add(el);
      });
    };

    const measure = () => {
      if (!alive) return;
      const wrap = wrapRef.current;
      if (wrap) {
        const bounds = wrap.getBoundingClientRect();
        const next: Spot[] = [];
        const targets: TargetEntry[] = [];

        specs.forEach((spec, index) => {
          const element = resolveTarget(wrap, spec, index);
          if (!element || !isMeasurable(element)) return;
          const rect = element.getBoundingClientRect();
          if (
            rect.width < 2 ||
            rect.height < 2 ||
            rect.bottom < bounds.top + 4 ||
            rect.top > bounds.bottom - 4
          ) {
            return;
          }

          const delay = index * 0.95;
          targets.push({ el: element, delay });
          next.push({
            key: index,
            label: spec.label,
            side: spec.side || 'bottom',
            delay,
            x: Math.round(rect.left - bounds.left),
            y: Math.round(rect.top - bounds.top),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
          });
        });

        syncTargets(targets);
        const signature = JSON.stringify(next);
        if (signature !== previous) {
          previous = signature;
          setSpots(next);
        }
      } else if (previous !== '[]') {
        previous = '[]';
        setSpots([]);
        clearTargets();
      }
      timer = window.setTimeout(measure, 160);
    };

    measure();
    return () => {
      alive = false;
      if (timer !== undefined) window.clearTimeout(timer);
      clearTargets();
    };
  }, [hotspots, uiId, wrapRef]);

  if (!spots.length) return null;

  return (
    <div className="irg-spots" aria-hidden="true">
      {spots.map((spot) => (
        <div
          key={spot.key}
          className={`irg-spot irg-spot-${spot.side}`}
          style={
            {
              left: spot.x,
              top: spot.y,
              width: spot.w,
              height: spot.h,
              animationDelay: `${spot.delay}s`,
            } as CSSProperties
          }
        >
          <span className="irg-spot-ring" />
          <span className="irg-spot-label">{spot.label}</span>
        </div>
      ))}
    </div>
  );
}
