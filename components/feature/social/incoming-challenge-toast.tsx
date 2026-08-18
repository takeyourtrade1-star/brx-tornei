'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Swords, X } from 'lucide-react';
import { checkIncomingChallengeAction, respondGameChallengeAction } from '@/actions/social';
import type { DirectGameChallenge } from '@/types/social';
import { getAvatarById } from '@/lib/avatars';
import { Button } from '@/components/ui/button';

export function IncomingChallengeToast() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<DirectGameChallenge | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    // Polling leggero ogni 10 secondi per verificare eventuali sfide in arrivo
    const interval = setInterval(async () => {
      if (challenge) return;
      const res = await checkIncomingChallengeAction();
      if (res.ok && res.data) {
        setChallenge(res.data);
      }
    }, 10_000);

    return () => clearInterval(interval);
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
    const res = await respondGameChallengeAction(challenge.id, 'accept');
    setActing(false);
    setChallenge(null);
    if (res.ok && res.data?.tableId) {
      router.push(`/tornei/${res.data.tableId}/live`);
    } else {
      router.push('/tornei');
    }
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

        <div className="mt-3.5 flex items-center gap-2">
          <Button
            type="button"
            disabled={acting}
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
