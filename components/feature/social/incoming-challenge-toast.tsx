'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { checkIncomingChallengeAction, respondGameChallengeAction } from '@/actions/social-challenges';
import type { DirectGameChallenge } from '@/types/social';
import { getAvatarById } from '@/lib/avatars';
import { Button } from '@/components/ui/button';
import { listDecksAction } from '@/actions/decks';
import { ChallengeDeckSelect } from './challenge-deck-select';
import type { Deck } from '@/types/deck';

const POLL_INTERVAL_MS = 15_000;

export function IncomingChallengeToast() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<DirectGameChallenge | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState('');
  const [loadingDecks, setLoadingDecks] = useState(false);

  useEffect(() => {
    if (challenge) return;
    let cancelled = false;
    const poll = async () => {
      const res = await checkIncomingChallengeAction();
      if (cancelled || challenge) return;
      if (res.ok && res.data) {
        setChallenge(res.data);
        setError(null);
      }
    };
    void poll();
    // Il poll a 3 s costava ~40 letture/minuto per tab (profilo + sfide) sul
    // rate limit per-IP del backend: era la voce piu' pesante del sito. A 15 s,
    // e solo con la tab in primo piano, l'attesa percepita resta accettabile
    // perche' la sfida scade in 60 s.
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void poll();
    }, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void poll();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [challenge]);

  useEffect(() => {
    if (!challenge) return;
    let cancelled = false;
    setLoadingDecks(true);
    void listDecksAction().then((result) => {
      if (cancelled) return;
      const compatible = 'decks' in result
        ? result.decks.filter((deck) => deck.formatId === challenge.format)
        : [];
      setDecks(compatible);
      setDeckId(compatible[0]?.id ?? '');
      setLoadingDecks(false);
    });
    return () => { cancelled = true; };
  }, [challenge]);

  useEffect(() => {
    if (!challenge) return;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.round((challenge.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setChallenge(null);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [challenge]);

  if (!challenge) return null;

  const avatar = getAvatarById(challenge.challengerAvatarId);
  const AvatarIcon = avatar.icon;

  const handleAccept = async () => {
    setActing(true);
    setError(null);
    const res = await respondGameChallengeAction(challenge.id, 'accept', deckId);
    setActing(false);
    if (res.ok && res.data?.tableId) {
      setChallenge(null);
      router.push(`/tornei/${res.data.tableId}/live`);
      return;
    }
    setError(res.error ?? 'Impossibile avviare la partita. Riprova.');
  };

  const handleDecline = async () => {
    setActing(true);
    await respondGameChallengeAction(challenge.id, 'decline');
    setActing(false);
    setChallenge(null);
  };

  return (
    <aside
      aria-label="Invito a duello"
      className="fixed bottom-5 right-5 z-[1050] w-full max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div className="overflow-hidden rounded-2xl border border-amber-400/40 bg-slate-950/95 p-4 text-white shadow-2xl shadow-black/80 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-amber-500 to-red-600 text-white shadow-md">
            <AvatarIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                Sfida in arrivo! ({secondsLeft}s)
              </span>
              <button
                type="button"
                onClick={handleDecline}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mt-0.5 truncate text-sm font-black text-white">
              {challenge.challengerGamertag} ti ha sfidato!
            </p>
            <p className="text-[11px] font-medium text-slate-300">
              Formato: <span className="font-bold text-white uppercase">{challenge.format}</span> · {challenge.bestOf}
            </p>
          </div>
        </div>

        {error ? (
          <p className="mt-2 text-[11px] font-semibold text-red-300">{error}</p>
        ) : null}

        <div className="mt-3">
          <ChallengeDeckSelect
            id="incoming-challenge-deck"
            decks={decks}
            selectedDeckId={deckId}
            loading={loadingDecks}
            onSelect={setDeckId}
          />
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <Button
            type="button"
            disabled={acting || loadingDecks || !deckId}
            onClick={handleAccept}
            className="h-8 flex-1 gap-1.5 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] text-xs font-black uppercase tracking-wider text-white shadow-sm hover:brightness-105"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Accetta</span>
          </Button>
          <button
            type="button"
            disabled={acting}
            onClick={handleDecline}
            className="h-8 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-bold text-slate-300 hover:bg-white/15 hover:text-white transition"
          >
            Rifiuta
          </button>
        </div>
      </div>
    </aside>
  );
}
