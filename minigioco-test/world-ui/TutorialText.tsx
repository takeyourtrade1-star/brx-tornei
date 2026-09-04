import type { ReactNode } from 'react';
import { TUT_BRAND } from '../world-client/tutorial-timing.js';

function findRange(text: string, needle: string): readonly [number, number] {
  const chars = Array.from(text || '');
  const sought = Array.from(needle || '');
  if (!sought.length) return [-1, -1];

  for (let start = 0; start <= chars.length - sought.length; start += 1) {
    if (sought.every((character, index) => chars[start + index] === character)) {
      return [start, start + sought.length];
    }
  }
  return [-1, -1];
}

function tutStepPillRange(text: string): readonly [number, number] {
  const match = text.match(/[1-3] di 3/);
  return match?.index === undefined || !match[0]
    ? [-1, -1]
    : [match.index, match.index + Array.from(match[0]).length];
}

export function renderTutReserve(full: string): ReactNode {
  const [pillStart, pillEnd] = tutStepPillRange(full);
  const chars = Array.from(full);
  if (pillStart < 0) return full;

  return (
    <>
      {chars.slice(0, pillStart).join('')}
      <span className="irg-tut-pill">{chars.slice(pillStart, pillEnd).join('')}</span>
      {chars.slice(pillEnd).join('')}
    </>
  );
}

export function renderTutTyped(typed: string, full: string): ReactNode[] {
  const [brandStart, brandEnd] = findRange(full, TUT_BRAND);
  const [pillStart, pillEnd] = tutStepPillRange(full);
  const typedChars = Array.from(typed);
  const characterClass = (index: number) => {
    const isBrand = brandStart >= 0 && index >= brandStart && index < brandEnd;
    return `irg-tut-ch${isBrand ? ' irg-tut-brand' : ''}`;
  };
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < typedChars.length) {
    if (pillStart >= 0 && index >= pillStart && index < pillEnd) {
      const pillChars: Array<{ readonly character: string; readonly index: number }> = [];
      while (index < typedChars.length && index < pillEnd) {
        pillChars.push({ character: typedChars[index], index });
        index += 1;
      }
      nodes.push(
        <span key={`pill-${pillStart}`} className="irg-tut-pill">
          {pillChars.map(({ character, index: characterIndex }) => (
            <span key={characterIndex} className={characterClass(characterIndex)}>
              {character}
            </span>
          ))}
        </span>,
      );
      continue;
    }

    const character = typedChars[index];
    if (character === '\n') {
      nodes.push(<br key={`br-${index}`} />);
      index += 1;
      continue;
    }
    if (/^\s$/.test(character)) {
      nodes.push(
        <span key={`space-${index}`} className={`irg-tut-sp ${characterClass(index)}`}>
          {character}
        </span>,
      );
      index += 1;
      continue;
    }

    const wordStart = index;
    let word = '';
    while (
      index < typedChars.length &&
      typedChars[index] !== '\n' &&
      !/^\s$/.test(typedChars[index]) &&
      !(pillStart >= 0 && index >= pillStart && index < pillEnd)
    ) {
      word += typedChars[index];
      index += 1;
    }
    if (!word) continue;
    nodes.push(
      <span key={`word-${wordStart}`} className="irg-tut-word">
        {Array.from(word).map((wordCharacter, offset) => (
          <span key={offset} className={characterClass(wordStart + offset)}>
            {wordCharacter}
          </span>
        ))}
      </span>,
    );
  }

  return nodes;
}
