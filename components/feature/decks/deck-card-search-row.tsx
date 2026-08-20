'use client';

import { getCardDisplayNames } from '@/lib/card-display-name';
import { getCardImageUrl, getSetIconUrl } from '@/lib/assets';
import type { SearchHit } from '@/types/search';

export function buildSearchUrl(q: string, page: number): string {
  const sp = new URLSearchParams();
  if (q) sp.set('q', q);
  sp.set('game', 'mtg');
  sp.set('limit', '20');
  sp.set('sort', 'relevance');
  sp.set('page', String(page));
  return `/api/search?${sp.toString()}`;
}

export async function fetchSearchPage(q: string, page: number) {
  const res = await fetch(buildSearchUrl(q, page));
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Errore ricerca (${res.status})`);
  }
  return res.json();
}

interface SearchHitRowProps {
  hit: SearchHit;
  lang: string;
  canAddMain: boolean;
  canAddSide: boolean;
  maxSide: number;
  onAddMain: () => void;
  onAddSide: () => void;
}

export function SearchHitRow({
  hit,
  lang,
  canAddMain,
  canAddSide,
  maxSide,
  onAddMain,
  onAddSide,
}: SearchHitRowProps) {
  const imgUrl = getCardImageUrl(hit.image ?? null);
  const setIconUrl = getSetIconUrl(hit.set_icon_uri, {
    gameSlug: hit.game_slug,
    setCode: hit.set_code ?? undefined,
  });
  const { primary, secondary } = getCardDisplayNames(hit, lang);

  return (
    <li className="flex items-stretch gap-3 border-b border-slate-900/5 px-2.5 py-2 transition-colors hover:bg-slate-50/80 last:border-b-0">
      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {imgUrl ? (
          <img src={imgUrl} alt={primary} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
            ?
          </div>
        )}
      </div>

      {setIconUrl ? (
        <img
          src={setIconUrl}
          alt=""
          className="hidden h-6 w-6 shrink-0 self-center object-contain sm:block"
          loading="lazy"
        />
      ) : null}

      <div className="min-w-0 flex-1 self-center">
        <p className="truncate text-xs font-bold text-header-bg">{primary}</p>
        {secondary ? <p className="truncate text-[10px] text-slate-500">{secondary}</p> : null}
        <p className="truncate text-[10px] text-slate-400">{hit.set_name}</p>
      </div>

      <div className="flex shrink-0 flex-col justify-center gap-1.5 self-center">
        <button
          type="button"
          disabled={!canAddMain}
          onClick={onAddMain}
          className="rounded-md bg-[#FF7300]/15 px-2 py-1 text-[10px] font-bold uppercase text-[#FF7300] transition-colors hover:bg-[#FF7300]/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Main
        </button>
        {maxSide > 0 ? (
          <button
            type="button"
            disabled={!canAddSide}
            onClick={onAddSide}
            className="rounded-md border border-slate-900/10 bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Side
          </button>
        ) : null}
      </div>
    </li>
  );
}
