'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, Palette } from 'lucide-react';
import { saveDefaultPlaymatAction } from '@/actions/decks';
import { Checkbox } from '@/components/ui/checkbox';
import { getPlaymat, PLAYMATS, type PlaymatId } from '@/lib/playmats';
import { cn } from '@/lib/utils';

interface DeckPlaymatSettingsProps {
  initialPlaymatId: PlaymatId;
  initialHomeBackgroundEnabled: boolean;
}

export function DeckPlaymatSettings({
  initialPlaymatId,
  initialHomeBackgroundEnabled,
}: DeckPlaymatSettingsProps) {
  const [playmatId, setPlaymatId] = useState(initialPlaymatId);
  const [homeBackgroundEnabled, setHomeBackgroundEnabled] = useState(initialHomeBackgroundEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const playmat = getPlaymat(playmatId);

  function savePreference(nextPlaymatId: PlaymatId, nextHomeBackgroundEnabled: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await saveDefaultPlaymatAction({
        playmatId: nextPlaymatId,
        homeBackgroundEnabled: nextHomeBackgroundEnabled,
      });
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setPlaymatId(nextPlaymatId);
      setHomeBackgroundEnabled(nextHomeBackgroundEnabled);
    });
  }

  function selectPlaymat(nextPlaymatId: PlaymatId) {
    if (nextPlaymatId === playmatId || pending) return;
    savePreference(nextPlaymatId, homeBackgroundEnabled);
  }

  function toggleHomeBackground(enabled: boolean) {
    if (pending) return;
    savePreference(playmatId, enabled);
  }

  return (
    <details className="group relative z-30 w-full sm:w-auto">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-white/10 bg-slate-950/65 p-1.5 pr-2.5 shadow-lg shadow-black/25 marker:hidden transition hover:border-primary/30 hover:bg-slate-900/80">
        <span
          className="h-9 w-12 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-white/15"
          style={{ backgroundImage: 'url(' + playmat.src + ')' }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.14em] text-primary">
            <Palette className="h-3 w-3" />
            Stile tappetino
          </span>
          <span className="mt-0.5 block max-w-36 truncate text-[11px] font-bold text-white/80">
            {playmat.name}
          </span>
        </span>
        <span className="grid h-6 w-6 place-items-center rounded-md text-white/45 transition duration-200 group-open:rotate-180 group-hover:text-white/70">
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </summary>

      <div className="absolute right-0 top-full z-40 mt-2 w-[calc(100vw-2rem)] max-w-xl rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-white">Stile tappetino</p>
            <p className="mt-0.5 text-[10px] text-white/45">Usato nelle partite fullscreen.</p>
          </div>
          {pending ? <span className="text-[9px] font-bold uppercase tracking-wide text-primary">Salvataggio…</span> : null}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PLAYMATS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectPlaymat(item.id)}
              aria-pressed={item.id === playmatId}
              disabled={pending}
              className={cn(
                'relative aspect-[16/7] overflow-hidden rounded-lg border text-left transition disabled:cursor-wait disabled:opacity-50',
                item.id === playmatId
                  ? 'border-primary ring-1 ring-primary/50'
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

        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.07] px-3 py-2.5">
          <Checkbox
            id="home-playmat-background"
            checked={homeBackgroundEnabled}
            onCheckedChange={toggleHomeBackground}
            disabled={pending}
            aria-label="Imposta come sfondo home"
            className="border-white/40 bg-transparent"
          />
          <label htmlFor="home-playmat-background" className="min-w-0 cursor-pointer">
            <span className="block text-xs font-black text-white">Usa anche nella home</span>
            <span className="mt-0.5 block text-[10px] text-white/45">Applica questo sfondo alla home dei tornei.</span>
          </label>
        </div>
        {error && <p className="mt-2 text-[10px] font-semibold text-red-300">{error}</p>}
      </div>
    </details>
  );
}
