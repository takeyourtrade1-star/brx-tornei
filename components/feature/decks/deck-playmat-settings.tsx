'use client';

import { useState, useTransition } from 'react';
import { Palette } from 'lucide-react';
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
    <details className="simple-panel mb-5 overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-white marker:hidden sm:px-5">
        <span
          className="h-10 w-16 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-white/20"
          style={{ backgroundImage: 'url(' + playmat.src + ')' }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
            <Palette className="h-4 w-4 text-primary" />
            Decorazione tappetino
          </span>
          <span className="mt-0.5 block truncate text-xs text-white/55">
            Predefinito fullscreen: {playmat.name}
          </span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider text-primary">Modifica</span>
      </summary>

      <div className="border-t border-white/10 px-4 py-4 sm:px-5">
        <p className="mb-3 text-xs text-white/60">
          Questa scelta verra mostrata come sfondo del tavolo in tutte le tue partite fullscreen.
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
                  ? 'border-primary ring-2 ring-primary/60'
                  : 'border-white/15 opacity-75 hover:border-white/35 hover:opacity-100',
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
        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
      </div>
    </details>
  );
}
