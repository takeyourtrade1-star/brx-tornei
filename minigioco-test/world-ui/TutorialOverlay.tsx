'use client';

import type { RefObject } from 'react';
import { AssoPixel } from './asso-pixel';
import { TutorialUiHotspots } from './TutorialUiHotspots';
import { renderTutReserve, renderTutTyped } from './TutorialText';
import { TUT_DURATION_LABEL, TUT_WAIT } from '../world-client/tutorial-timing';

interface TutorialOverlayProps {
  readonly tutorialActive: boolean;
  readonly caption: string | null;
  readonly typedCaption: string;
  readonly intro: boolean;
  readonly outro: boolean;
  readonly typing: boolean;
  readonly uiSpot: string | null;
  readonly helperVisible: boolean;
  readonly helperBubble: string | null;
  readonly wrapRef: RefObject<HTMLElement>;
  readonly onHelperClick: () => void;
  readonly skipTutorial: () => void;
  readonly repeatTutorial: () => void;
  readonly simpleViewLabel: string;
  readonly onSimpleView: () => void;
}

export function TutorialOverlay(props: TutorialOverlayProps): React.JSX.Element {
  const {
    tutorialActive, caption, typedCaption, intro, outro, typing, uiSpot,
    helperVisible, helperBubble, wrapRef, onHelperClick, skipTutorial,
    repeatTutorial, simpleViewLabel, onSimpleView,
  } = props;
  return (
    <>
      {tutorialActive && (
        <div className={`irg-tut${intro ? ' irg-tut-intro' : ''}${outro ? ' irg-tut-final' : ''}`}>
          <div className="irg-tut-bar">
            <span className="irg-tut-ghost" aria-hidden><AssoPixel /></span>
            <span className="irg-tut-text" aria-live="off">
              <span className="irg-tut-reserve" aria-hidden>{caption ? renderTutReserve(caption) : TUT_WAIT}</span>
              <span className="irg-tut-typed" aria-hidden>
                {!caption && !typedCaption && TUT_WAIT}
                {caption && renderTutTyped(typedCaption, caption)}
                {typing && <span className="irg-tut-caret" />}
              </span>
              <span className="sr-only" role="status">{caption || TUT_WAIT}</span>
            </span>
            {outro ? (
              <div className="irg-tut-actions">
                <div className="irg-tut-repeat">
                  <button type="button" className="irg-tut-btn irg-tut-yes" onClick={skipTutorial}>Inizia a esplorare</button>
                  <button type="button" className="irg-tut-btn irg-tut-no" onClick={repeatTutorial}>Ripeti</button>
                </div>
                <button type="button" className="irg-tut-btn irg-tut-simple" onClick={onSimpleView}>{simpleViewLabel}</button>
              </div>
            ) : (
              <div className="irg-tut-side">
                <button type="button" className="irg-tut-skip" onClick={skipTutorial}>Salta tutorial</button>
                <span className="irg-tut-dur">{TUT_DURATION_LABEL}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {tutorialActive && uiSpot && <TutorialUiHotspots wrapRef={wrapRef} uiId={uiSpot} />}
      {helperVisible && !tutorialActive && (
        <button type="button" className={`irg-helper${helperBubble ? ' irg-helper-talking' : ''}`}
          onClick={onHelperClick} aria-label="Asso, la tua guida" title="Un consiglio da Asso">
          {helperBubble && <span className="irg-helper-bubble" role="status">{helperBubble}</span>}
          <span className="irg-helper-asso" aria-hidden><AssoPixel /></span>
        </button>
      )}
    </>
  );
}
