'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, Palette } from 'lucide-react';
import { saveDefaultPlaymatAction } from '@/actions/decks';
import { getPlaymat, PLAYMATS, type PlaymatId } from '@/lib/playmats';
import { cn } from '@/lib/utils';

interface DeckPlaymatSettingsProps {
  initialPlaymatId: PlaymatId;
}

export function DeckPlaymatSettings({ initialPlaymatId }: DeckPlaymatSettingsProps) {
  const [playmatId, setPlaymatId] = useState(initialPlaymatId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const playmat = getPlaymat(playmatId);

  function selectPlaymat(nextPlaymatId: PlaymatId) {
    if (nextPlaymatId === playmatId || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await saveDefaultPlaymatAction({ playmatId: nextPlaymatId });
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setPlaymatId(nextPlaymatId);
    });
  }

  return (
    <details className="arena-panel group">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden sm:px-5">
        <span
          className="h-10 w-16 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-white/15"
          style={{ backgroundImage: 'url(' + playmat.src + ')' }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-black text-white">
            <Palette className="h-4 w-4 text-primary" />
            Decorazione tappetino
          </span>
          <span className="mt-0.5 block truncate text-xs text-white/55">
            Predefinito fullscreen: {playmat.name}
          </span>
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-white/50 transition-transform duration-200 group-open:rotate-180">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </span>
      </summary>

      <div className="border-t border-white/10 px-4 py-4 sm:px-5">
        <p className="mb-3 text-xs text-white/55">
          Questa scelta verrà mostrata come sfondo del tavolo in tutte le tue partite fullscreen.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {PLAYMATS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectPlaymat(item.id)}
              aria-pressed={item.id === playmatId}
              disabled={pending}
              className={cn(
                'relative aspect-[16/7] overflow-hidden rounded-xl border text-left transition disabled:cursor-wait disabled:opacity-50',
                item.id === playmatId
                  ? 'border-primary ring-2 ring-primary/40'
                  : 'border-white/15 opacity-80 hover:border-primary/40 hover:opacity-100',
              )}
              style={{ backgroundImage: 'url(' + item.src + ')', backgroundPosition: 'center', backgroundSize: 'cover' }}
            >
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/10" />
              <span className="absolute inset-x-2 bottom-1.5 truncate text-[10px] font-black uppercase tracking-wide text-white">
                {item.name}
              </span>
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-xs font-semibold text-red-300">{error}</p>}
      </div>
    </details>
  );
}
